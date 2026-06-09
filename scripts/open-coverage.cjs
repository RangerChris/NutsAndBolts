// Open the Vitest HTML coverage report in the default browser.
// Cross-platform: Windows (start), macOS (open), Linux (xdg-open).
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const reportPath = path.join(__dirname, '..', 'coverage', 'index.html');

if (!fs.existsSync(reportPath)) {
  console.error(`No coverage report found at ${reportPath}.`);
  console.error('Run `npm run coverage` first to generate it.');
  process.exit(1);
}

const url = `file://${reportPath.replace(/\\/g, '/')}`;

let command;
let args;
if (process.platform === 'win32') {
  command = 'cmd';
  args = ['/c', 'start', '', url];
} else if (process.platform === 'darwin') {
  command = 'open';
  args = [url];
} else {
  command = 'xdg-open';
  args = [url];
}

const child = spawn(command, args, { detached: true, stdio: 'ignore' });
child.on('error', (err) => {
  console.error(`Failed to open coverage report: ${err.message}`);
  process.exit(1);
});
child.unref();

console.log(`Opening coverage report: ${url}`);
