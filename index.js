/*
 * @Author: strongest-qiang 1309148358@qq.com
 * @Date: 2023-10-31 20:16:59
 * @LastEditors: strongest-qiang 1309148358@qq.com
 * @LastEditTime: 2023-11-05 10:52:39
 * @FilePath: \webRTC\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
// highlight-start
const { Server } = require("socket.io");
// highlight-end

const app = express();
app.use(express.static(join(__dirname, "/public")));
const server = createServer(app);
// highlight-start
const io = new Server(server);
// highlight-end

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  socket.on("createRoom", (data) => {
    const { userId, roomId } = data;
    socket.join(roomId);
    io.to(roomId).emit("createRoomSuccess", {
      userId,
      roomId,
      code: 0,
      msg: `${userId}-创建房间-${roomId}-成功`,
    });
  });
  socket.on("peer-join", (data) => {
    const { userId, roomId } = data;
    socket.join(roomId);
    io.to(roomId)
      .except(socket.id)
      .emit("create-offer", {
        userId,
        roomId,
        code: 1,
        msg: `${userId}-加入房间-${roomId}-成功,请准备视频通话,创建offer`,
      });
  });
  socket.on("send-offer", (data) => {
    // 发送方的userId,以及发送方的sdp
    const { userId, roomId, sdp } = data;
    io.to(roomId).except(socket.id).emit("recive-offer", {
      userId,
      roomId,
      sdp,
      code: 2,
      msg: `发起方已经发起视频会话，请点击接收视频通话按钮接`,
    });
  });

  socket.on("answer", (data) => {
    // 回应者的userId,以及回应者的sdp
    const { userId, roomId, sdp } = data;
    io.to(roomId).except(socket.id).emit("remote-dsp", {
      userId,
      roomId,
      code: 3,
      sdp,
      msg: `回应者已经接收了offer，并且响应了自己的sdp`,
    });
  });
  socket.on("need-ice_candidate", (data) => {
    // 回应者的userId,以及回应者的candidate
    const { userId, roomId, candidate } = data;

    // console.log(io.sockets.adapter.rooms);// 获取所有房间
    // console.log(io.sockets.adapter.rooms.get(roomId));// 获取某个特定的房间

    io.to(roomId)
      .except(socket.id)
      .emit("ice-candidate", {
        userId,
        roomId,
        code: 4,
        candidate,
        msg: `userId-${userId},触发ice-candidate，并且交换了candidate`,
      });
  });
  socket.on("socket-leave", (data) => {
    const { userId, roomId } = data;

    io.to(roomId).emit("recive-socket-leave", {
      userId,
      roomId,
      code: 5,
      msg: `userId-${userId},已经离开房间`,
    });

    socket.leave(roomId); // 将某个房间的特定的连接的websocket对象断开

    if (io.sockets.adapter.rooms.get(roomId) === undefined) {
      //当房间内部的set集合为0时，结果会为undefined
      io.sockets.adapter.rooms.delete(roomId); // 删除某个房间
    }
  });
  socket.on("socket-rooms", (data) => {
    const allSockets = io.sockets.sockets;
    console.log(allSockets);
    // 遍历所有的 Socket 对象
    allSockets.forEach((client) => {
      // 在这里可以对每个 Socket 对象进行操作
      if (socket.id == client.id) {
        socket.emit("get-socket-rooms-success", {
          msg: "socket.id--" + client.id,
        });
      }
    });
  });
  socket.on("disconnect", () => {
    console.log(`socket:${socket.id} -- client disconnected`);
    // 处理客户端断开连接后的逻辑
  });
  socket.on("error", (error) => {
    console.error("A server-side error occurred:", error);
    // 处理服务器端错误逻辑
  });
});
// highlight-end

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
