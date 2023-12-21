# LLC-Controls

Simple script to automate the opening and closing of firms on LLC

Calculates:

If a firm is profitable to run, if so turns it on
If profit is between -2 or +2 then it turns selling off and starts stockpiling (if stockpile is set to true for that resources)
Calculates average dividend for past 500 hours


Set up:
Copy the .env.example file (remove.example) and add your cookie to it.

open up terminal and run:
npm install
npm start

All future runs just require npm start
