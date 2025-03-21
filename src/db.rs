use std::{fmt::Display, time::SystemTime};

use anyhow::{anyhow, Result};
use rand::prelude::*;
use rusqlite::{params, Connection, Row, Statement};
use serde::{Deserialize, Serialize};

pub struct Db(rusqlite::Connection);

impl Db {
    pub fn open() -> Self {
        let conn = Connection::open("./database.sqlite").expect("Cannot open database.");
        Db(conn)
    }

    pub fn init(&self) -> Result<()> {
        self.0.execute_batch("CREATE TABLE IF NOT EXISTS task(id TEXT PRIMARY KEY, top REAL, left REAL, text TEXT, color TEXT)")
            .map_err(|e| anyhow!("Cannot create table. {e}"))?;
        self.0
            .execute_batch("VACUUM")
            .map_err(|e| anyhow!("Cannot cleanup database. {e}"))
    }

    pub fn get_all(&self) -> Result<Vec<TaskInfo>> {
        let mut stmt = self.prepare("SELECT * FROM task")?;
        let mut rows = stmt
            .query([])
            .map_err(|e| anyhow!("Cannot get tasks. {e}"))?;
        let mut tasks = Vec::new();
        while let Ok(Some(row)) = rows.next() {
            let task = TaskInfo::builder()
                .id(row.get("id")?)
                .pos(row.get("top")?, row.get("left")?)
                .text(row.get("text")?)
                .color(row.get("color")?)
                .build();
            tasks.push(task);
        }
        Ok(tasks)
    }

    pub fn create_task(&self, info: &TaskInfo) -> Result<TaskInfo> {
        let mut stmt = self.prepare("INSERT INTO task VALUES(?1, ?2, ?3, ?4, ?5)")?;
        let id = create_id();
        let Position { top, left } = info.get_pos();
        let text = info.get_text();
        let color = info.get_color_as_string();
        stmt.execute(params![id, top, left, text, color])?;
        Ok(TaskInfo {
            id: Some(id),
            pos: Some(Position::from((top, left))),
            text: Some(text),
            color: Some(Color::from(color)),
        })
    }

    pub fn delete_task(&mut self, id: &str) -> Result<()> {
        let mut stmt = self.prepare("DELETE FROM task WHERE id = ?1")?;
        stmt.execute([id.to_owned()])
            .map_err(|_| anyhow!("Failed to update text. {id}"))
            .map(|_| ())
    }

    pub fn change_color(&mut self, id: &str, color: &Color) -> Result<()> {
        let mut stmt = self.prepare("UPDATE task SET color = ?1 WHERE id = ?2")?;
        let color = color.to_string();
        stmt.execute([color, id.to_owned()])
            .map_err(|_| anyhow!("Failed to update color. {id}"))
            .map(|_| ())
    }

    pub fn edit_text(&self, id: &str, text: &str) -> Result<()> {
        let mut stmt = self.prepare("UPDATE task SET text = ?1 WHERE id = ?2")?;
        let text = text.replace("'", "''");
        stmt.execute([text, id.to_owned()])
            .map_err(|_| anyhow!("Failed to update text. {id}"))
            .map(|_| ())
    }

    pub fn move_task(&mut self, id: &str, pos: &Position) -> Result<()> {
        let mut stmt = self.prepare("UPDATE task SET top = ?1, left = ?2 WHERE id = ?3")?;
        stmt.execute(params![pos.top, pos.left, id.to_owned()])
            .map_err(|_| anyhow!("Failed to move task. {id}"))
            .map(|_| ())
    }

    pub fn update_to_fromt(&mut self, id: &str) -> Result<()> {
        let tx = self.0.transaction()?;
        let task_info =
            tx.query_row("SELECT * FROM task WHERE id = ?1", [id.to_owned()], |row| {
                Ok(TaskInfo::from(row))
            })?;
        tx.execute("DELETE FROM task WHERE id = ?1", [id.to_owned()])?;
        let id = task_info.get_id();
        let Position { top, left } = task_info.get_pos();
        let text = task_info.get_text();
        let color = task_info.get_color_as_string();
        tx.execute(
            "INSERT INTO task VALUES(?1, ?2, ?3, ?4, ?5)",
            params![id, top, left, text, color],
        )?;
        tx.commit()?;
        Ok(())
    }

    fn prepare(&self, sql: &str) -> Result<Statement> {
        self.0
            .prepare(sql)
            .map_err(|_| anyhow!("Failed to prepare statement {sql}"))
    }
}

const ALPHABET: &str = "abcdefghijklmnopqrstuvwxyz";

fn create_id() -> String {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let mut alphabets = String::new();
    for _ in 0..3 {
        let n = thread_rng().gen_range(0..ALPHABET.len());
        let a = ALPHABET.chars().nth(n).unwrap();
        alphabets.push(a);
    }
    format!("{now}{alphabets}")
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct TaskInfo {
    id: Option<String>,
    color: Option<Color>,
    pos: Option<Position>,
    text: Option<String>,
}

impl Display for TaskInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "id={}, color={}, pos={}, text={}",
            self.get_id(),
            self.get_color_as_string(),
            self.get_pos(),
            self.get_text()
        )
    }
}

pub struct TaskInfoBuilder(TaskInfo);

impl TaskInfo {
    pub fn builder() -> TaskInfoBuilder {
        TaskInfoBuilder(TaskInfo::default())
    }
    pub fn get_id(&self) -> String {
        match &self.id {
            Some(id) => id.clone(),
            None => String::new(),
        }
    }
    pub fn get_color_as_string(&self) -> String {
        match &self.color {
            Some(color) => color.to_string(),
            None => Color::default().to_string(),
        }
    }
    pub fn get_color(&self) -> Color {
        match &self.color {
            Some(color) => color.clone(),
            None => Color::default(),
        }
    }
    pub fn get_pos(&self) -> Position {
        match &self.pos {
            Some(pos) => Position {
                top: pos.top,
                left: pos.left,
            },
            None => Position::default(),
        }
    }
    pub fn get_text(&self) -> String {
        match &self.text {
            Some(text) => text.clone(),
            None => String::new(),
        }
    }
}

impl From<&Row<'_>> for TaskInfo {
    fn from(row: &Row) -> Self {
        let pos = Position {
            top: row.get("top").unwrap_or(0f64),
            left: row.get("left").unwrap_or(0f64),
        };
        Self {
            id: row.get("id").map(Some).unwrap_or(None),
            color: row
                .get("color")
                .map(|col: String| Some(Color::from(col)))
                .unwrap_or(None),
            pos: Some(pos),
            text: row.get("text").map(Some).unwrap_or(None),
        }
    }
}

impl TaskInfoBuilder {
    fn id(mut self, id: String) -> Self {
        self.0.id = Some(id);
        self
    }
    fn color(mut self, color: String) -> Self {
        self.0.color = Some(Color::from(color));
        self
    }
    fn pos(mut self, top: f64, left: f64) -> Self {
        self.0.pos = Some(Position::from((top, left)));
        self
    }
    fn text(mut self, text: String) -> Self {
        self.0.text = Some(text);
        self
    }
    fn build(self) -> TaskInfo {
        self.0
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub enum Color {
    Red,
    Orange,
    Yellow,
    Green,
    Blue,
    Indigo,
    Purple,
    #[default]
    White,
    Black,
}

impl<T> From<T> for Color
where
    T: AsRef<str>,
{
    fn from(value: T) -> Self {
        let value = value.as_ref();
        match value {
            "red" => Color::Red,
            "orange" => Color::Orange,
            "yellow" => Color::Yellow,
            "green" => Color::Green,
            "blue" => Color::Blue,
            "indigo" => Color::Indigo,
            "purple" => Color::Purple,
            "black" => Color::Black,
            _ => Color::White,
        }
    }
}

impl Display for Color {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Color::Red => write!(f, "red"),
            Color::Orange => write!(f, "orange"),
            Color::Yellow => write!(f, "yellow"),
            Color::Green => write!(f, "green"),
            Color::Blue => write!(f, "blue"),
            Color::Indigo => write!(f, "indigo"),
            Color::Purple => write!(f, "purple"),
            Color::White => write!(f, "white"),
            Color::Black => write!(f, "black"),
        }
    }
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Position {
    top: f64,
    left: f64,
}

impl From<(f64, f64)> for Position {
    fn from((top, left): (f64, f64)) -> Self {
        Self { top, left }
    }
}

impl Display for Position {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "(top={}, left={})", self.top, self.left)
    }
}
