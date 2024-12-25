import os
import dash
from dash import callback, html, Input, Output, State
from dash_chat import ChatComponent
from openai import OpenAI


#import os
from dotenv import load_dotenv
#from openai import OpenAI

load_dotenv()


#api_key = os.environ.get("OPENAI_API_KEY")
#client = OpenAI(api_key=api_key)
client = OpenAI()


app = dash.Dash(__name__)

app.layout = html.Div([
    ChatComponent(
        id="chat-component",
        messages=[
            {"role": "assistant", "content": "Hello!"},
        ],
    )
])

@callback(
    Output("chat-component", "messages"),
    Input("chat-component", "new_message"),
    State("chat-component", "messages"),
    prevent_initial_call=True,
)
def handle_chat(new_message, messages):
    if not new_message:
        return messages

    updated_messages = messages + [new_message]

    if new_message["role"] == "user":
        response = client.chat.completions.create(
            model="gpt-40-mini",
            messages=updated_messages,
            temperature=1.0,
            max_tokens=150,
        )

        bot_response = {"role": "assistant", "content": response.choices[0].message.content.strip()}
        return updated_messages + [bot_response]

    return updated_messages

if __name__ == "__main__":
    app.run_server(debug=True)