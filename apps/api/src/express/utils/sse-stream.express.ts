import type { Response } from 'express';

export class SSEStream {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
    this.setupHeaders();
  }

  private setupHeaders() {
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.setHeader('Access-Control-Allow-Origin', '*');
  }

  sendData(data: any) {
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendToken(content: string) {
    this.sendData({ content });
  }

  sendTool(toolName: string) {
    this.sendData({ type: 'tool', toolName });
  }

  sendError(error: string) {
    this.sendData({ type: 'error', error });
  }

  sendDone() {
    this.res.write(`data: [DONE]\n\n`);
  }

  end() {
    this.res.end();
  }
}

