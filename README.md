# HiPlip Open Conversation — Open-Source AI English Tutor, Speaking Practice & Vocabulary Games

HiPlip Open Conversation is a self-hosted English learning web app with an AI conversation tutor, A1 beginner lessons, vocabulary quizzes, and a word matching game. Practise everyday spoken English with your own OpenAI-compatible provider, or review the sample lessons and play Word Match without an API key.

![HiPlip promotional artwork](public/preview.jpg)

[Explore the full HiPlip English learning site](https://hiplipenglish.io/)

## Features

- Learn: three A1 samples: Greetings, Introducing Yourself, and Ordering Food.
- Practice: three questions per lesson with explanations and a score. Learn and Practice work without an API key.
- Free conversation with short corrections and follow-up questions.
- Typed replies, optional browser speech recognition, and playback.
- API settings with an endpoint, model, session-only key, and a connection test.

## Getting Started

Use Node.js 20 or later. From the repository directory, run:

```sh
npm start
```

Open http://127.0.0.1:3072. Under **API settings**, enter an OpenAI-compatible API base URL, model and key. Test the connection, save, and try saying or typing “I’d like to order a coffee, please.”

The browser sends conversation text and the credential directly to the endpoint you choose. Use a trusted endpoint and a scoped key. The provider must allow browser requests from your app’s origin, including CORS preflight. The application keeps settings in memory until reload. Browser speech recognition may use a service supplied by the browser.

Run `npm test` to check the API request and response contract.

## Project Structure

- `public/` contains the interface, the sample lesson, browser speech integration and the API client.
- `serve.mjs` serves the application on loopback.
- `provider.test.mjs` checks endpoint validation and the AI request contract.

## License

The source code is available under the [MIT License](LICENSE). HiPlip branding and the included promotional artwork are reserved and provided for display in this project.

## Optional integrations

Settings include English and Simplified Chinese navigation, a separate tutor explanation language, and playback speed from 0.5× to 1.5×. Sample study text stays in English. Word Match uses the vocabulary of the selected sample lesson.

- **Stripe subscriptions:** Set `STRIPE_PAYMENT_LINK` to your Stripe recurring Payment Link and `STRIPE_PORTAL_LINK` to your hosted customer portal login link before starting the server. These links are optional. Stripe handles checkout and subscription management. This sample does not grant app entitlements or handle webhooks.
- **Firebase Analytics:** Set `FIREBASE_PROJECT_ID`, `FIREBASE_MEASUREMENT_ID`, `FIREBASE_API_KEY` and `FIREBASE_APP_ID` to your Firebase web app’s public config. Enable Analytics for that app. Users can opt in from Settings. Custom events contain event names only, and no conversation text or provider credentials. Firebase Authentication is outside this integration.

## A1 English lessons and vocabulary quizzes

Choose a beginner lesson by the conversation you want to practise. The sample lessons teach short expressions you can use immediately, and each quiz gives you a score and explains the answers.

| Lesson | Conversation goal |
| --- | --- |
| Greetings | Say hello and choose a greeting that fits the situation |
| Introducing Yourself | Share your name and respond when you meet someone |
| Ordering Food | Make a polite request in a café or restaurant |

Try the vocabulary matching game after a lesson. Select a word or phrase and match it with its meaning. The game uses the vocabulary from your current lesson, so you can revisit the same English expressions in a different format.

## English speaking practice with an AI conversation partner

Start a free conversation by saying or typing something you might use in everyday life. For example, try introducing yourself or asking for a coffee. The AI tutor can give a short correction and ask a follow-up question so you can keep the conversation going. Use the speaker button on a tutor reply to hear it again.

Select English or Simplified Chinese for navigation, and choose the tutor's explanation language separately. The target expressions stay in English. Lower the playback speed to listen more carefully, or raise it to practise following a faster reply.

## Troubleshooting self-hosted English practice

| What you see | What to check |
| --- | --- |
| AI connection test fails | Check the base URL, model ID and key. The provider must accept browser requests from your app's origin. |
| Browser voice input is unavailable | Check microphone permission and whether your browser supports speech recognition. You can type your answer in the same conversation. |
| You want to practise without an AI provider | Open a sample lesson, take its quiz, or play Word Match. These activities run without an API key. |

For the full course catalogue and more English learning activities, visit [HiPlip English](https://hiplipenglish.io/).
