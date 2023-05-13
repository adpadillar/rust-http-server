use serde::Deserialize;
use tide::Request;

#[derive(Debug, Deserialize)]
struct DataReq {
    current: u16,
}

#[async_std::main]
async fn main() -> tide::Result<()> {
    let mut app = tide::new();

    match app.at("/").serve_file("client/dist/index.html") {
        Ok(_) => {
            print!("Handle OK");
        }
        Err(_) => {
            print!("Handle Err!")
        }
    }

    match app.at("/").serve_dir("client/dist/") {
        Ok(_) => {
            print!("Handle OK");
        }
        Err(_) => {
            print!("Handle Err!")
        }
    };

    app.at("/api").post(get_data);

    app.listen("127.0.0.1:8080").await?;
    Ok(())
}

async fn get_data(mut req: Request<()>) -> tide::Result {
    let DataReq { current } = req.body_json().await?;
    Ok(format!("Hello, from server! Next click is {}", current + 10).into())
}
