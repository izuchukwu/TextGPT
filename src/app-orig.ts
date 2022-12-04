/* eslint-disable no-console */
import * as playwright from 'playwright'
import express from 'express'
import twilio from 'twilio'
import * as dotenv from 'dotenv'

dotenv.config()

const app = express()
const browser = await playwright.chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
const twilioClient = twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
)

async function getInputBox() {
	const box = await page.$('textarea')
	return box
}

function isLoggedIn() {
	return getInputBox() !== null
}

async function sendMessage(message: string) {
	const box = await getInputBox()
	if (!box) return
	box.click()
	box.fill(message)
	box.press('Enter')
}

async function getLastMessage() {
	const pageElements = await page.$$(
		"div[class*='ConversationItem__Message']"
	)
	const lastElement = pageElements[pageElements.length - 1]
	const text = await lastElement.innerText()
	return text
}

async function chat(message: string): Promise<string> {
	sendMessage(message)
	// TODO: there are about ten million ways to be smarter than this
	return new Promise((resolve) => {
		setTimeout(async () => {
			const response = await getLastMessage()
			resolve(response)
		}, 10000)
	})
}

app.post('/chat', async (req, res) => {
	const message = req.query.q as string
	console.log(`Sending message: ${message}`)
	const response = await chat(message)
	console.log(`Response: ${response}`)
	res.send(response)
})

app.post('/sms', async (req, res) => {
	const {Body} = req.body
	const response = await chat(Body)
	twilioClient.messages.create({
		from: process.env.TWILIO_PHONE_NUMBER,
		to: req.body.From,
		body: response ?? "Sorry, I didn't understand that"
	})
	res.send('')
})

function startBrowser() {
	page.goto('https://chat.openai.com/')
	if (!isLoggedIn()) {
		console.log('Please log in to OpenAI Chat')
		console.log("Press enter when you're done")
		process.stdin.on('data', () => {
			console.log('Logged in')
			app.listen(5001, () => {
				console.log('Server listening on port 5001')
			})
		})
	} else {
		console.log('Logged in')
		app.listen(5001, () => {
			console.log('Server listening on port 5001')
		})
	}
}

startBrowser()
