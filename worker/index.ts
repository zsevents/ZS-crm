// Cloudflare Worker entry: serves the existing Express API unchanged.
import { httpServerHandler } from 'cloudflare:node';
import app from '../api/index.js';

app.listen(8080);

export default httpServerHandler({ port: 8080 });
