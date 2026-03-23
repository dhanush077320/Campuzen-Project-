const fs = require('fs');
const path = 'c:/Users/DHANUSH/OneDrive/Documents/Campuzen Final/frontend/src/components/DriverDashboard.jsx';
const content = fs.readFileSync(path, 'utf8');

let opens = 0;
let closes = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') opens++;
    if (content[i] === '}') closes++;
}

console.log('Opens:', opens);
console.log('Closes:', closes);
if (opens !== closes) {
    console.log('MISMATCH FOUND!');
} else {
    console.log('Brackets balanced.');
}
