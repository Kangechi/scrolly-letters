/* 
This is the 'database':
Basically it stores the structure of what is in the card
So that the user can type their own stuff, edit & send it to the person
*/

export const cardData = [
    {
        id: 'for_Bianca',
        recipient: 'Friend',
        theme: 'hue',
        emoji: '👓',
        birthday: '2026-06-01',
        sections: [
            {
                type: 'hero',
                headline: 'Happy Birthday Bianca 🌟',
                sub: 'To the friend that is like a safe space.'
            },
            {
                type: 'who',
                headline: 'How I see you 👀',
                text: 'As a beautiful lady who is outspoken, wonderful to be around, smart and lovely.A brave and inspiring soul 💪, that keeps persevering and pushing despite all that comes her way. Someon I enjoy conversations with and learn from.'


            },
            {
                type: 'message',
                sub: 'What I have to say...🗣️',
                text: " I'm honoured to have you in my life. Funny enough your the friend I didn't think I'd keep this long. I worried that it would fade. But here we are 🫂🫂 and I hope we continue facing the world together. As you advance into a new season, I'm here cheering you on through every step 👏.I can't wait to see what God will do in your life... what you will become.When life gets hard because it will, remember His love for you and that there are peopl you can reach out to. Have a blast on this special day."
            },
            {
                type: 'memory',
                label: ' 💖 A moment I carry',
                text: "I always find it funny how it was you & me as the only form one's who went for intercessors 🙃. From there somehow this bond was formed out of an encounter 😉."
            },
            {
                type: 'closing',
                sub: '🙏🙏',
                line: `I pray that everything works for you favour and for you good, by God's Grace.`,
                cta: 'Share this card'
            }
        ]
    },
    {
        id: 'for_Baraka',
        recipient: 'Baraka',
        theme: 'warm',
        emoji: '🐵',
        lateMessage: 'A bit later than expected',
        lateSub: 'But all good things take time....',
        sections: [
            {
            type: 'hero',
            headline: 'Happy Birthday Baraka 💫',
            sub: 'To the one who pursues Christ and growth.'
            },
            {
                type: 'who',
                headline: 'Who you are',
                text: 'You are a friend that is warm, very outspoken and not afraid to be themselves in a room. That is the spark you carry and have.'
            },
            {
                type: 'message',
                sub: 'What I have to say......',
                text: "To the person who is alwyas seeking God and seeks to always improve themselves. It's an honour to know you and to be your friend. It's beautiful to see your passion for christ and the drive you have to continuosly improve yourself. As you grow older, I'm happy for you. This is because it means that the journey your on.. God is not done with you yet. I wish you all the best as you continue to navigate life and grow into who God created you to be."
            },
            {
                type: 'memory',
                label: 'A moment I carry',
                text: 'Having a conversation with you at the service was a lovely and interesting experience, leading to our friendship today.'

            },
            {
                type: 'closing',
                text: 'My prayer for you',
                line: 'May God grant you favour and clarity as you transition into a new season',
                cta: 'Share this card'

            }


 
       ]
    }
]