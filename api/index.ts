import app from '../server';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Function Execution Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Serverless function execution failure.',
      });
    }
  }
}

