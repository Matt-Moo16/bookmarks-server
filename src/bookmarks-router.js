const express = require('express')
const logger = require('./logger')
const store = require('./store')
const { isWebUri } = require('valid-url')
const {v4: uuid} = require('uuid')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: bookmark.title, 
    url: bookmark.url,
    description: bookmark.description,
    rating: Number(bookmark.rating),
})

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializeBookmark))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const {title, url, rating, description} = req.body

        if (!rating) {
            logger.error(`No rating supplied`)
            return res
                .status(400)
                .send(`'rating' is required`)
        }
    
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
    .route('/bookmarks/:bookmark_id')
    .get((req, res, next) => {
      const { bookmark_id } = req.params
      BookmarksService.getById(req.app.get('db'), bookmark_id)
        .then(bookmark => {
          if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`)
            return res.status(404).json({
              error: { message: `Bookmark Not Found` }
            })
          }
          res.json(serializeBookmark(bookmark))
        })
        .catch(next)
    })
    .delete((req, res) => {
        // TODO: update to use db
        const { bookmark_id } = req.params
    
        const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id)
    
        if (bookmarkIndex === -1) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`)
          return res
            .status(404)
            .send('Bookmark Not Found')
        }
    
        store.bookmarks.splice(bookmarkIndex, 1)
    
        logger.info(`Bookmark with id ${bookmark_id} deleted.`)
        res
          .status(204)
          .end()
      })

module.exports = bookmarksRouter