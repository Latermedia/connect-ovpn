const core = require('@actions/core');
const ping = require('ping')
const path = require('path')

function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        throw error
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

(async() => {
  try {
    const ovpnFile = core.getInput('ovpn');
    const caCrtBase64 = core.getInput('ca-crt');
    const userCrtBase64 = core.getInput('user-crt');
    const userKeyBase64 = core.getInput('user-key');
    const pingURL = core.getInput('ping-url');

    const profileAbsolutePath = path.resolve(process.cwd(), ovpnFile)

    console.log(`\n\tUse profile: ${profileAbsolutePath}`)

    execShellCommand(`echo '${caCrtBase64}' | base64 -d >> ca.crt`)
    execShellCommand(`echo '${userCrtBase64}' | base64 -d >> user.crt`)
    execShellCommand(`echo '${userKeyBase64}' | base64 -d >> user.key`)

    execShellCommand(`sudo openvpn --config ${profileAbsolutePath} --daemon`)

    if (pingURL) {
      ping.promise
        .probe(pingURL, {
          timeout: 15,
          min_reply: 15,
        })
        .then(function (res) {
          if (res.alive) {
            core.info('Connect vpn passed')
            core.setOutput('STATUS', true)
          } else {
            core.setFailed('Connect vpn failed')
            core.setOutput('STATUS', false)
          }
        })
    } else {
      core.setOutput('STATUS', true)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
