use async_std::{prelude::*, sync::RwLock};
use serde::Deserialize;
use std::{collections::HashMap, sync::Arc};
use tide::{Body, Request, Response};
use tide_websockets::{Message, WebSocket};

#[derive(Deserialize, Clone, Debug)]
struct Room {
    id: String,
    frame: String,
}

#[derive(Clone)]
struct State {
    rooms: Arc<RwLock<HashMap<String, Room>>>,
}

#[async_std::main]
async fn main() -> tide::Result<()> {
    let state = State {
        rooms: Default::default(),
    };
    let mut app = tide::with_state(state);

    match app.at("/").serve_file("client/dist/index.html") {
        Ok(_) => (),
        Err(e) => println!("Error: {}", e),
    };

    app.at("/*").get(serve_files);

    app.at("/ws/send")
        .get(WebSocket::new(move |req, mut stream| async move {
            while let Some(Ok(Message::Text(input))) = stream.next().await {
                let state: &State = req.state();
                let mut rooms = state.rooms.write().await;

                let frame = match serde_json::from_str::<Room>(input.as_str()) {
                    Ok(client_room) => {
                        let room_id = client_room.id.clone();
                        let room_frame = client_room.frame.clone();
                        rooms.insert(room_id, client_room);

                        room_frame
                    }
                    Err(_e) => String::from(""),
                };

                stream.send_string(frame).await?;
            }

            Ok(())
        }));

    app.at("/ws/receive")
        .get(WebSocket::new(move |req, mut stream| async move {
            while let Some(Ok(Message::Text(input))) = stream.next().await {
                let state: &State = req.state();
                let rooms = state.rooms.write().await;

                let frame = match serde_json::from_str::<Room>(input.as_str()) {
                    Ok(client_room) => {
                        let room_id = client_room.id.clone();

                        match rooms.get(&room_id) {
                            Some(room) => room.frame.clone(),
                            None => String::from(""),
                        }
                    }
                    Err(_e) => String::from(""),
                };

                stream.send_string(frame).await?;
            }

            Ok(())
        }));

    app.listen("0.0.0.0:3000").await?;
    Ok(())
}

async fn serve_files(req: Request<State>) -> tide::Result {
    let path = req.url().path();

    let server_path = format!("client/dist/{}", path);
    let exists = std::path::Path::new(server_path.as_str()).exists();

    let mut res = Response::new(200);

    match exists {
        true => res.set_body(Body::from_file(server_path).await?),
        false => res.set_body(Body::from_file("client/dist/index.html").await?),
    }

    Ok(res)
}
