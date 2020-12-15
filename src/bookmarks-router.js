const express = require('express')
const logger = require('./logger')
const store = require('./store')
const { isWebUri } = require('valid-url')
const {v4: uuid} = require('uuid')
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title), 
    url: bookmark.url,
    description: xss(bookmark.description),
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
    .post(bodyParser, (req, res, next) => {
        const {title, url, rating, description} = req.body

        ratingInt = Number.parseInt(rating);

        if (!rating) {
            logger.error(`No rating supplied`)
            return res
                .status(400)
                .send(`'rating' is required`)
        }
    
        if (!Number.isInteger(ratingInt) || ratingInt < 0 || ratingInt >= 5) {
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
            title,
            url,
            description,
            rating
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created.`)
                res 
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

    bookmarksRouter
    .route('/bookmarks/:bookmark_id')
    .all((req, res, next) => {
      const { bookmark_id } = req.params
      BookmarksService.getById(req.app.get('db'), bookmark_id)
        .then(bookmark => {
          if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`)
            return res.status(404).json({
              error: { message: `Bookmark Not Found` }
            })
          }
          res.bookmark = bookmark
          next()
        })
        .catch(next)
    })
    .get((req, res) => {
      res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { bookmark_id } = req.params;
        BookmarksService.deleteBookmark(knexInstance, bookmark_id)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark_id} deleted.`);
                res.status(204).end()
        })
        .catch(next)
    })
  

module.exports = bookmarksRouter