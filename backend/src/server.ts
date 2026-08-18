import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import config from './config/env';
import { Server } from 'socket.io';
import { initializeChatSocket } from './sockets/chatSocket';
import { initSchedulers, stopSchedulers } from './sockets/scheduler.init';
import mongoose from 'mongoose';

const PORT = config.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

initializeChatSocket(io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

const startServer = async () => {
  await connectDB();
  
  initSchedulers();
  
  server.listen(PORT, () => {
    console.log(`Server is running in ${config.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // Close socket.io connections
  io.close(() => {
    console.log('Socket.io closed.');
  });
  
  // Stop background schedulers
  stopSchedulers();
  
  // Close database connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if not closed
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
