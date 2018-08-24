module.exports.getCoinScore = main;

const Twit = require('twit');
const dotenv = require('dotenv');
const Sentiment = require('sentiment');
const colors = require('colors/safe');

dotenv.config();

const { CONSUMER_KEY = 'vit3d6ZbmvOkVnjHvIEOIMu3u'
      , CONSUMER_SECRET = 'xLO7WWruY1n04JbiXpmI6VuCTfG0924wLOR5jDETsUAoovfjFO'
      , ACCESS_TOKEN = '4828009493-Rmb9xnJmwzKdMxK4AwY1YPNV0HtXpwORkJRdOEp'
      , ACCESS_TOKEN_SECRET = 'bFD59pWkfSUIaaSok4lyJU2wvrbR9SWnuHQzf4RIhSFMb'
      } = process.env;

const config_twitter = {
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token: ACCESS_TOKEN,
    access_token_secret: ACCESS_TOKEN_SECRET,
    timeout_ms: 60*1000
};

let api = new Twit(config_twitter);

function get_text(tweet) {
    let txt = tweet.retweeted_status ? tweet.retweeted_status.full_text : tweet.full_text;
    return txt.split(/ |\n/).filter(v => !v.startsWith('http')).join(' ');
}

async function get_tweets(q, count) {
    let tweets = await api.get('search/tweets', {q, count, 'tweet_mode': 'extended'});
    return tweets.data.statuses.map(get_text);
}

async function main(keyWord) {
    let keyword = keyWord;
    let count = 100;
    let tweets = await get_tweets(keyword, count);
    let coinScore = 0;
    let sentiment = new Sentiment();
    for (tweet of tweets) {
        let score = sentiment.analyze(tweet).score;
        coinScore += score;
    }
    return coinScore;
}