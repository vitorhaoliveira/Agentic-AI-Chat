import type { FastifyReply } from 'fastify';

export class SSEStream {
  private reply: FastifyReply;

  constructor(reply: FastifyReply) {
    this.reply = reply;
    this.setupHeaders();
  }

  private setupHeaders() {
    this.reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
  }

  sendEvent(event: string, data: any) {
    this.reply.raw.write(`event: ${event}\n`);
    this.reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendData(data: any) {
    this.reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendToken(content: string) {
    this.sendData({ type: 'token', content });
  }

  sendTool(toolName: string) {
    this.sendData({ type: 'tool', toolName });
  }

  sendError(error: string) {
    this.sendData({ type: 'error', error });
  }

  sendDone() {
    this.reply.raw.write('data: [DONE]\n\n');
  }

  end() {
    this.reply.raw.end();
  }
}

