import express from 'express'
import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 5002

app.post('/incoming-sms', async (req, res) => {
	// Get the incoming message and sender's number
	const {body, from} = req.body

	// Send the message to the AI API endpoint
	const response = await fetch(`http://localhost:5001/chat?q=${body}`)
	const json = await response.json()

	// Send the response back to the sender
	const twilioClient = twilio(
		process.env.TWILIO_SID,
		process.env.TWILIO_AUTH_TOKEN
	)
	twilioClient.messages.create({
		body: json,
		from: process.env.TWILIO_PHONE_NUMBER,
		to: from
	})
})

app.listen(port, () => {
	console.log(`Server listening on port ${port}`)
})
