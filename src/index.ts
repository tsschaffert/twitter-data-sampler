//const fs = require('fs');
import * as fs from 'fs';
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'input', type: String, multiple: false, defaultOption: true }
];

const fileRegex = /^([0-9]+)\.json$/;

interface Tweet {
    created_at: string,
    id_str: string,
    text: string,
    user: {
        id_str: string
    },
    retweeted: boolean,
}

function main(options) {
    if (options.input === undefined) {
        console.error("Input folder is needed.");
        process.exit(1);
        return;
    }
    filterData(options.input);
    sampleFolder(".tmp");
}

function filterData(foldername: string) {
    let tmpDirname = ".tmp";
    if (fs.existsSync(tmpDirname)) {
        // TODO does not work
        fs.rmdirSync(tmpDirname);
    }

    fs.mkdirSync(tmpDirname);

    let files = fs.readdirSync(foldername);

    for (let file of files) {
        let match = fileRegex.exec(file);

        if (match.length > 1) {
            let userid = match[1];

            let tweets = getUserTweets(foldername, userid);
            tweets = tweets.filter((tweet) => !tweet.retweeted);

            if (tweets.length >= 100) {
                writeSample(`${tmpDirname}/${userid}.json`, tweets);
            }
        }
    }
}

function sampleFolder(foldername: string) {
    let files = fs.readdirSync(foldername);

    for (let file of files) {
        let match = fileRegex.exec(file);

        if (match.length > 1) {
            let userid = match[1];

            sampleUser(foldername, userid);
        }
    }
}

function sampleUser(foldername: string, userid: string) {
    if (fs.existsSync(`out/${userid}.json`)) {
        // Don't do anything if output file already exists
        console.log(`${userid}: Output exists.`);
        return;
    }

    let tweets = getUserTweets(foldername, userid);
    let userTweetCount = tweets.length;

    if (userTweetCount < 100) {
        console.log(`${userid}: Not enough data.`);
        return;
    }

    console.log(`${userid}: ${tweets.length}`);

    let files = fs.readdirSync(foldername);
    let otherUserids = files.map((value) => {
        let match = fileRegex.exec(value);
        if (match.length > 1) {
            return match[1];
        } else {
            return null;
        }
    }).filter((value) => value !== null && value !== userid);

    let sampleMapping = createSampleMapping(otherUserids, userTweetCount);
    // TODO files may not contain enough tweets (number of tweets in each file not known at this point, so it's possible to end up with less tweets than expected)
    // Alternative would be to touch every file multiple times and avoid duplicates by comparing tweet ids
    //console.log(JSON.stringify(sampleMapping, null, 2));

    for (let otherUserid in sampleMapping) {
        let numberToTake = sampleMapping[otherUserid];

        let additionalTweets = getUserTweets(foldername, otherUserid, numberToTake);
        if (additionalTweets.length !== numberToTake) {
            //console.log("Not enough tweets found.");
        }

        tweets.push(...additionalTweets);
    }

    if (tweets.length === userTweetCount * 2) {
        console.log("Sampling successful.");
    } else if (tweets.length > userTweetCount) {
        console.log("Sampling partially successful.");
    } else {
        console.log("Sampling failed.");
    }

    writeSample(`out/${userid}.json`, tweets);
}

function getUserTweets(foldername: string, userid: string, count?: number): Tweet[] {
    let filename = `${foldername}/${userid}.json`;

    let tweets: Tweet[] = JSON.parse(fs.readFileSync(filename, "utf-8"));

    if (count === undefined) {
        return tweets;
    } else {
        let indices = [];

        // Make sure to not attempt to take more tweets than available
        count = Math.min(tweets.length, count);

        for (let i = 0; i < count; i++) {
            let rand = -1;
            do {
                rand = Math.floor(Math.random() * tweets.length);
            } while (indices.indexOf(rand) >= 0);

            indices.push(rand);
        }

        return tweets.filter((value, index) => indices.indexOf(index) >= 0);
    }
}

function writeSample(filename: string, tweets: Tweet[]) {
    fs.writeFileSync(filename, JSON.stringify(tweets, null, 2));
}

function createSampleMapping(userids: string[], count: number) : { [key: string]: number } {
    let result = userids.reduce((list, id) => {
        list[id] = 0;
        return list;
    }, {});

    for (let i = 0; i < count; i++) {
        let rand = Math.floor(Math.random() * userids.length);
        let user = userids[rand];
        let current = result[user];
        result[userids[Math.floor(Math.random() * userids.length)]]++;
    }

    return result;
}

main(commandLineArgs(optionDefinitions))