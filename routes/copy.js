const router = require('express').Router()
const Copy = require('../models/copy')
const Copied = require('../models/copied')
const User = require('../models/user')
const mongoose = require("mongoose")

router.post('/getAllCopies', async (req, res) => {
  const { limit } = req.body
  try {
    const copies = await Copy.find().limit(limit)

    res.json({
      copies
    })
  } catch (error) {
    throw ("error")
  }
})

router.post('/getCopies', async (req, res) => {
  const { _id } = req.body
  try {
    const copiesArray = []

    const user = await User.findOne({ _id })

    user.copies.forEach(async element => {
      const copies = await Copy.find({ _id: element })
      copiesArray.push(...copies)
    })

    setTimeout(() => {
      res.json({
        user: user.copies,
        copies: copiesArray
      })
    }, 5000)
  } catch (error) {
    throw ("error")
  }
})

router.post('/copy', async (req, res) => {
  const { user, copy, image, name, wins, losses, rate, profit, from, to, bankState, salesState, currency, amount } = req.body

  const _user = await Copied.findOne({ copy })

  if (_user) {
    res.json({
      message: 'Already copied'
    })
  } else {
    try {
      const _copy = await Copied.create({
        _id: new mongoose.Types.ObjectId(),
        copy,
        user,
        _user: user,
        image,
        name,
        wins,
        losses,
        rate,
        profit,
        from,
        to,
        bankState,
        salesState,
        currency,
        amount
      })

      const _user = await User.updateOne({ _id: user }, {
        $addToSet: {
          copies: copy
        }
      })

      res.json({
        copy: _copy,
        user: _user
      })
    } catch (error) {
      throw ("error")
    }
  }
})

module.exports = router
