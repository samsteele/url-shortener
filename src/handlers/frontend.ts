import { APIGatewayProxyHandler } from 'aws-lambda';

const PAGE = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>link.samsteele.co.uk</title>
    <style>
        :root { color-scheme: light dark; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            margin: 0; min-height: 100vh; display: grid; place-items: center;
            background: #0f1115; color: #e7e9ee; padding: 1.5rem;
        }
        main { width: 100%; max-width: 28rem; }
        h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
        p.sub { margin: 0 0 1.5rem; color: #9aa0ad; font-size: 0.95rem; }
        form { display: flex; gap: 0.5rem; }
        input {
            flex: 1; padding: 0.7rem 0.85rem; border-radius: 0.6rem;
            border: 1px solid #2a2f3a; background: #161922; color: inherit; font-size: 1rem;
        }
        input:focus { outline: 2px solid #4c8bf5; border-color: transparent; }
        button {
            padding: 0.7rem 1.1rem; border: none; border-radius: 0.6rem;
            background: #4c8bf5; color: white; font-size: 1rem; font-weight: 600; cursor: pointer;
        }
        button:disabled { opacity: 0.6; cursor: default; }
        #result { margin-top: 1.25rem; min-height: 1.5rem; font-size: 0.95rem; }
        #result a { color: #7aa7ff; word-break: break-all; }
        .row { display: flex; gap: 0.5rem; align-items: center; }
        .copy { padding: 0.4rem 0.7rem; font-size: 0.85rem; background: #2a2f3a; }
        .error { color: #ff8080; }
    </style>
</head>
<body>
    <main>
        <h1>Shorten a link</h1>
        <p class="sub">Paste a URL and get a short link.</p>
        <form id="form">
            <input id="url" type="text" inputmode="url" name="url" required autofocus>
            <button id="submit" type="submit">Shorten</button>
        </form>
        <div id="result"></div>
    </main>
    <script>
        const form = document.getElementById('form');
        const input = document.getElementById('url');
        const button = document.getElementById('submit');
        const result = document.getElementById('result');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            button.disabled = true;
            result.textContent = 'Shortening…';
            try {
                const res = await fetch('/urls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ longUrl: input.value }),
                });
                const data = await res.json();
                if (!res.ok) {
                    result.innerHTML = '<span class="error">' + (data.error || 'Something went wrong') + '</span>';
                    return;
                }
                result.innerHTML =
                    '<div class="row"><a href="' + data.shortUrl + '">' + data.shortUrl + '</a>' +
                    '<button class="copy" type="button">Copy</button></div>';
                result.querySelector('.copy').addEventListener('click', async (ev) => {
                    await navigator.clipboard.writeText(data.shortUrl);
                    ev.target.textContent = 'Copied';
                });
            } catch {
                result.innerHTML = '<span class="error">Network error</span>';
            } finally {
                button.disabled = false;
            }
        });
    </script>
</body>
</html>`;

export const handler: APIGatewayProxyHandler = async () => ({
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: PAGE,
});
