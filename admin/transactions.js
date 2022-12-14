const router = require('express').Router()
const Deposit = require('../models/deposit')
const Transaction = require('../models/transaction')
const Withdraw = require('../models/withraw')
const checkAuth = require("../middleware/auth")

router.post('/get', checkAuth, async (req, res) => {
  let transactions = await Transaction.find()

  if (transactions.length >= 1)
    return res.status(200).json({
      message: "transactions found",
      transactions,
    })
  else
    return res.status(200).json({
      message: "transactions not found",
      transactions: [],
    })
})

router.post('/getTransactions', checkAuth, async (req, res) => {
  const { user } = req.body

  let transactions = await Transaction.find({ user })

  if (transactions.length >= 1)
    return res.status(200).json({
      message: "transactions found",
      transactions,
    })
  else
    return res.status(200).json({
      message: "transactions not found",
      transactions: [],
    })
})

router.post('/getSingleTransaction', checkAuth, async (req, res) => {
  const { _id } = req.body

  let transaction = await Transaction.findOne({ _id })

  return res.status(200).json({
    message: "transaction found",
    transaction,
  })
})

router.get('/getPendingTransactions', checkAuth, async (req, res) => {
  let transaction = await Transaction.find({ status: 'PENDING' })

  return res.status(200).json({
    message: "transaction found",
    transaction,
  })
})

router.get('/getConfirmedTransactions', checkAuth, async (req, res) => {
  let transaction = await Transaction.find({ status: 'CONFIRMED' })

  return res.status(200).json({
    message: "transaction found",
    transaction,
  })
})

router.post('/confirmTransactionRequest', checkAuth, async (req, res) => {
  const { _id } = req.body
  try {
    const transaction = await Transaction.updateOne({ _id }, { $set: { status: 'CONFIRMED' } })
    if (transaction.type == 'deposit') await Deposit.updateOne({ _id }, { $set: { status: 'CONFIRMED' } })
    if (transaction.type == 'withdraw') await Withdraw.updateOne({ _id }, { $set: { status: 'CONFIRMED' } })

    res.json({
      transaction
    })
  } catch (error) {
    return res.status(401).json({
      message: "update failed",
      error,
    })
  }
})

module.exports = router