# Kanban

Kanban is a simple task sharing application built with Rust. It helps you organize your tasks and projects using the Kanban methodology.

## Why Kanban?

Kanban is designed to help remote teams collaborate effectively by sharing tasks and updates seamlessly. It mimics the experience of using a physical whiteboard, allowing users to visualize and manage their workflow intuitively.

## Features

- Create, update, and delete tasks.
- Lightweight and fast, powered by Rust.
- Drag and drop tasks anywhere on the board, without being restricted to predefined columns, mimicking a physical whiteboard.
- 2 modes, Task(To Do / Doing / Done) for task sharing and KPT(Keep / Problem / Try) for retrospectives

## Installation

1. Set environment variables to configure app:

    | Environment Variable | Description                     | Default Value |
    |-----------------------|---------------------------------|---------------|
    | `KANBAN_PORT`         | The port on which the server runs. | `3000`        |
    | `KANBAN_MODE`         | The mode in which the app runs (`task` or `kpt`). | `task` |

1. Run the app with `cargo run` or pre-built binary with `cargo build --locked --release`

1. Access `http://server:port`

## Usage

### How to Use

- **Add a Sticky Note**: Double-click anywhere on the board to create a new sticky note.
- **Edit a Sticky Note**: Double-click a sticky note or press the `F2` key to edit its text. The text supports Markdown formatting.
- **Customize Sticky Notes**: Use the context menu to change the color of a sticky note or delete it.
- **Move Sticky Notes**: Drag and drop sticky notes to rearrange them on the board.

### Backup Data

To back up your data, simply copy the `database.sqlite` file located in the application directory to your desired destination. You can use the following command:

```bash
cp /path/to/application/directory/database.sqlite /path/to/backup/destination/
```

Replace `/path/to/application/directory/` with the actual path to your Kanban application directory and `/path/to/backup/destination/` with the location where you want to store the backup.

## Technical Information

Kanban is built using modern and efficient technologies:

- **Rust**: The core of the application is written in Rust, providing safety, speed, and reliability.
- **Axum**: A web framework for building robust and scalable HTTP services, used for handling server-side logic.
- **Askama**: A templating engine for Rust, used to render HTML templates efficiently.
- **Vanilla JavaScript**: The frontend is built with plain JavaScript for simplicity and flexibility.
- **Socket.IO**: Enables real-time communication between the server and clients, ensuring instant updates to the Kanban board.
- **SQLite**: A lightweight and self-contained database used to store tasks and application data.

These technologies work together to deliver a seamless and responsive user experience.
