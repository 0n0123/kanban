mod db;

use std::env;

use anyhow::{Result, anyhow};
use askama::Template;
use axum::{extract::Query, response::IntoResponse};
use db::{Db, TaskInfo};
use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef},
    layer::SocketIoLayer,
};
use tracing::{error, info, warn};
use tracing_subscriber::fmt::writer::MakeWriterExt;

#[tokio::main]
async fn main() -> Result<()> {
    prepare_logger();

    Db::open()
        .init()
        .inspect_err(|e| error!("Failed to initialize DB. {e}"))?;

    let socket_layer = setup_socketio();

    let app = route(socket_layer);
    let port = match env::var("KANBAN_PORT").map(|var| var.parse::<u16>()) {
        Ok(Ok(port)) => port,
        _ => 3000,
    };

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .map_err(|_| anyhow!("Failed to bind port {port}."))?;

    info!("Listening on port {port}");

    axum::serve(listener, app)
        .await
        .map_err(|_| anyhow!("Failed to start up server."))
}

fn prepare_logger() {
    let file_appender = tracing_appender::rolling::daily("./logs", "server.log");
    let stdout = std::io::stdout.with_max_level(tracing::Level::INFO);
    tracing_subscriber::fmt()
        .with_thread_names(true)
        .json()
        .with_writer(stdout.and(file_appender))
        .init();
}

fn route(socket: SocketIoLayer) -> axum::Router {
    axum::Router::new()
        .route("/", axum::routing::get(render))
        .nest_service("/assets", tower_http::services::ServeDir::new("assets"))
        .layer(socket)
}

async fn render(Query(IndexQuery { readonly }): Query<IndexQuery>) -> axum::response::Response {
    let mode = Mode::read();
    let readonly = readonly.unwrap_or(false);
    info!("Render index. mode={:?}, readonly={readonly}", &mode);
    let index = Index { mode, readonly };
    match index.render() {
        Ok(html) => axum::response::Html(html).into_response(),
        Err(e) => {
            error!("Failed to render index. {e}");
            axum::response::Html("Failed to render index.".to_string()).into_response()
        }
    }
}

#[derive(Deserialize)]
struct IndexQuery {
    readonly: Option<bool>,
}

#[derive(askama::Template)]
#[template(path = "index.html")]
struct Index {
    mode: Mode,
    readonly: bool,
}

#[derive(Debug)]
enum Mode {
    Task,
    Kpt,
}

impl Mode {
    fn read() -> Self {
        let env = env::var("KANBAN_MODE").unwrap_or_else(|_| "task".to_string());
        match env.to_ascii_lowercase().as_str() {
            "kpt" => Mode::Kpt,
            _ => Mode::Task,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    tasks: Vec<TaskInfo>,
}

impl Message {
    fn new(tasks: Vec<TaskInfo>) -> Self {
        Message { tasks }
    }
}

fn setup_socketio() -> SocketIoLayer {
    let (layer, io) = SocketIo::builder().build_layer();

    io.ns("/", |socket: SocketRef| {
        info!("Client connected. {}", socket.id);

        let tasks = Db::open()
            .get_all()
            .inspect_err(|e| error!("Cannot get tasks. {e}"))
            .unwrap_or_else(|_| Vec::new());

        if let Err(e) = socket.emit("welcome", &Message::new(tasks)) {
            error!("Failed to emit welcome message. {e}");
        }

        socket.on("create", create);
        socket.on("color", change_color);
        socket.on("text", edit_text);
        socket.on("move", move_task);
        socket.on("delete", delete_task);
        socket.on("tofront", to_front);
    });

    layer
}

#[tracing::instrument(skip(socket))]
async fn create(socket: SocketRef, Data(mes): Data<Message>) {
    let mut tasks = Vec::new();
    for info in mes.tasks.iter() {
        match Db::open().create_task(info) {
            Ok(info) => {
                info!("New task is created.");
                tasks.push(info)
            }
            Err(e) => error!("Failed to create task. {e}"),
        };
    }
    let mes = Message::new(tasks);
    if let Err(e) = socket.broadcast().emit("create", &mes).await {
        warn!("Failed to broadcast create message. {e}");
    }
    if let Err(e) = socket.emit("create", &mes) {
        warn!("Failed to emit create message. {e}");
    }
}

#[tracing::instrument(skip(socket))]
async fn change_color(socket: SocketRef, Data(mes): Data<Message>) {
    update_tasks(socket, mes, ColorChanger).await;
}

#[tracing::instrument(skip(socket))]
async fn edit_text(socket: SocketRef, Data(mes): Data<Message>) {
    update_tasks(socket, mes, TextEditor).await;
}

#[tracing::instrument(skip(socket))]
async fn move_task(socket: SocketRef, Data(mes): Data<Message>) {
    update_tasks(socket, mes, PosMover).await;
}

#[tracing::instrument(skip(socket))]
async fn delete_task(socket: SocketRef, Data(mes): Data<Message>) {
    update_tasks(socket, mes, TaskDeleter).await;
}

#[tracing::instrument(skip(socket))]
async fn to_front(socket: SocketRef, Data(mes): Data<Message>) {
    update_tasks(socket, mes, TaskRaiser).await;
}

trait TaskUpdater {
    fn update(&self, info: &TaskInfo) -> Result<()>;
    fn get_event(&self) -> &'static str;
}

#[derive(Default)]
struct ColorChanger;
impl TaskUpdater for ColorChanger {
    fn update(&self, info: &TaskInfo) -> Result<()> {
        let color = info.get_color();
        Db::open().change_color(&info.get_id(), &color)
    }

    fn get_event(&self) -> &'static str {
        "color"
    }
}

#[derive(Default)]
struct TextEditor;
impl TaskUpdater for TextEditor {
    fn update(&self, info: &TaskInfo) -> Result<()> {
        let text = info.get_text();
        Db::open().edit_text(&info.get_id(), &text)
    }

    fn get_event(&self) -> &'static str {
        "text"
    }
}

#[derive(Default)]
struct PosMover;
impl TaskUpdater for PosMover {
    fn update(&self, info: &TaskInfo) -> Result<()> {
        Db::open().move_task(&info.get_id(), &info.get_pos())
    }

    fn get_event(&self) -> &'static str {
        "move"
    }
}

#[derive(Default)]
struct TaskDeleter;
impl TaskUpdater for TaskDeleter {
    fn update(&self, info: &TaskInfo) -> Result<()> {
        Db::open().delete_task(&info.get_id())
    }

    fn get_event(&self) -> &'static str {
        "delete"
    }
}

#[derive(Default)]
struct TaskRaiser;
impl TaskUpdater for TaskRaiser {
    fn update(&self, info: &TaskInfo) -> Result<()> {
        Db::open().update_to_front(&info.get_id())
    }

    fn get_event(&self) -> &'static str {
        "tofront"
    }
}

async fn update_tasks(socket: SocketRef, mes: Message, updater: impl TaskUpdater) {
    let mut tasks = Vec::new();
    for info in mes.tasks.iter() {
        if updater.update(info).is_ok() {
            tasks.push(info.clone())
        }
    }
    let updated_ids: Vec<String> = tasks.iter().map(|t| t.get_id()).collect();
    info!("Task is updated. updated={:?}", &updated_ids);

    let mes = Message::new(tasks);
    let event = updater.get_event();

    if let Err(e) = socket.broadcast().emit(event, &mes).await {
        warn!("Failed to broadcast {event} message. {e}");
    }
    if let Err(e) = socket.emit(event, &mes) {
        warn!("Failed to emit {event} message. {e}");
    }
}
