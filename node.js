// Express.js route example
app.post("/api/chat", async (req, res) => {
    const { prompt } = req.body;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are Jarvesh AI, created by the Janaksewa AI Engineering Team..." },
                { role: "user", content: prompt }
            ]
        })
    });
    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
});