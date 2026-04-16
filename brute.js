const crypto = require('crypto');

const secret = 'CUOiu29FKZ569lcSlJFaggn0u0b8vzHWz5kLKprKIFg';
const secretBase64 = Buffer.from(secret, 'base64');
const secretB64Url = Buffer.from(secret, 'base64url');

const session_id = '265c4c3c-be9e-4e9f-9ae9-902a00fa37ea';
const status = 'Not Started';
const created_at = '1776328928';
const timestamp = '1776328928';

const expectedHash = '6187184eb72c3088002877c2e4437cf99890b7bbed171a0ef93a9cdf392e8ec2';

const possibleStrings = [
  `${session_id}|${status}|${created_at}`,
  `${session_id}|${status.toLowerCase()}|${created_at}`,
  `${session_id}|${status.toUpperCase()}|${created_at}`,
  `${session_id}|not_started|${created_at}`,
  `${session_id}|NOT_STARTED|${created_at}`,
  `${session_id}|Not Started|${timestamp}`,
  `${timestamp}|${session_id}|${status}`,
  `${created_at}|${status}|${session_id}`,
  // What if it's application_id?
  `11c56545-ebe4-4e56-a32a-fb98c96522ad|${status}|${created_at}`,
  `71d914e3-32c4-48cb-8df3-a58cae04a275|${status}|${created_at}`, // event_id
];

for (const sec of [secret, secretBase64, secretB64Url]) {
  for (const s of possibleStrings) {
    const hash = crypto.createHmac('sha256', sec).update(s).digest('hex');
    if (hash === expectedHash) {
      console.log('MATCH FOUND!');
      console.log('Secret type:', typeof sec === 'string' ? 'string' : 'Buffer');
      console.log('String:', s);
      process.exit(0);
    }
  }
}
console.log('No match found.');
