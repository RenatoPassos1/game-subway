const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const path = require("path");

const config = {
  user: "u665946898.clickwin.fun",
  password: "]2xG4dZ48H]y?mY>",
  host: "185.211.7.160",
  port: 21,
  localRoot: path.join(__dirname, "packages/frontend/out"),
  remoteRoot: "/public_html/",
  include: ["*", "**/*", ".*"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then((res) => console.log("Finished:", res.transferredFileCount, "files transferred"))
  .catch((err) => console.error("Error:", err));

ftpDeploy.on("uploading", (data) => {
  process.stdout.write(`[${data.transferredFileCount}/${data.totalFilesCount}] ${data.filename}\r`);
});
