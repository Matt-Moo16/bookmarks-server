const express = require('express')
const logger = require('./logger')
const store = require('./store')
const { isWebUri } = require('valid-url')
const {v4: uuid} = require('uuid')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(store.bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const {title, url, rating, description} = req.body
    
        if (!Number.isInteger(rating) || rating < 0 || rating >= 5) {
            logger.error(`Rating ${rating} supplied is invalid`)
            return res
                .status(400)
                .send(`'rating' must be a number between 0 and 5`)
        }

        if (!title) {
            logger.error(`Title is required`)
            return res
                .status(400)
                .send(`Title is required`)
        }

        if (!isWebUri(url)) {
            logger.error(`Invalid url '${url}' supplied`)
            return res
                .status(400)
                .send(`'url' must be a valid url`)
        }

        if (!description) {
            logger.error(`Description ${description} is not valid`)
            return res 
                .status(400)
                .send(`Description is required`)
        }

        const newBookmark = {
            id: uuid(),
            title,
            url,
            description,
            rating
        }

        store.bookmarks.push(newBookmark)
        res.status(201).json(newBookmark)
    })

    bookmarksRouter
        .route('/bookmarks/:id')
        .get((req, res) => {
            const { id } = req.params;
            const bookmark = store.bookmarks.find(i => i.id == id)

            if (!bookmark) {
                logger.error(`Bookmark with id ${id} not found.`)
                return res
                    .status(404)
                    .send('Bookmark Not Found');
            }
            res.json(bookmark)
        })

        .patch(bodyParser, (req, res) => {
            const {id} = req.params
            const bookmark = store.bookmarks.find(b => b.id == id)
            
            if(!bookmark) {
                logger.error(`Bookmark with id ${id} not found.`)
                return res
                    .status(404)
                    .send(`Bookmark Not Found`)
            }

            const { description } = req.body
            bookmark.description = description
            res.json(bookmark)
        })

        .delete((req, res) => {
            const {id} = req.params;
            const bookmarkIndex = store.bookmarks.find(b => b.id == id)

            if (bookmarkIndex === -1) {
                logger.error(`Bookmark with id ${id} not found.`);
                return res
                    .status(404)
                    .send('Not found');
            }
            store.bookmarks.splice(bookmarkIndex, 1)
            logger.info(`Bookmark with id ${id} deleted.`)
            res
                .status(204)
                .end()
        })

module.exports = bookmarksRouter