const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeployX Test Project</title>
      </head>

      <body style="
        font-family: Arial;
        background: #111;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
      ">
        <div style="text-align:center">
          <h1>🚀 DeployX Runtime Works</h1>
          <p>This project is running inside Docker.</p>
          <p>Deployed by the DeployX Agent.</p>
        </div>
      </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Application running on port ${PORT}`);
});