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
    },
    {
        id: 'for_Dad',
        recipient: 'Dad',
        theme: 'exec',
        emoji: '👑',
        sections: [
            {
                type: 'hero',
                headline: 'You are loved, seen & cared for',
                sub: 'This is just a reminder'
            },
             {
                type: 'who',
                headline: 'What I see in you',
                text: 'When I look at you Dad, I see perserverance, strength and a man always trying his best regardless of the circumstances.'
            },
            {
                type: 'message',
                sub: 'What do you need to remember?',
                text: "The first is that you are deeply seen  and loved. Not even by us, but the Creator. God who created you for a purpose far greater than you could imagine. I know sometimes it's hard especially with retirement. It may feel like what do I have to offer the world 🌍 now? Where will my stability come from? So in the midst of all that thinking, worrying and even chasing after your dream, know that you have a safe space to go to. Remember that you are also deeply loved 💖 and valued by your family 👨‍👩‍👧‍👦."
            },
            {
                type: 'memory',
                label: 'What I carry with me... that came from you',
                text: "I always found how confident and comfortable you were speaking infront of a crowd amazing!! This is actually what pushed me to public speaking and pursuing platforms that I can also speak on. Just wanted you to know that the next time you see me speaking, it's because I saw you first."

            },
            {
                type: 'closing',
                text: 'My prayer for you',
                line: 'May God grant you favour and clarity as you transition into a new season. May He guide you even as you explore leadership & may He use you as a vessel for His kingdom. I also pray that He gives you the grace to obey and walk in His ways.',
                cta: 'Share this card'

            }
            
        ]
    },
    {
        id: 'for_Mom',
        recipient: 'Mom',
        theme: 'lovely',
        emoji: '🍫💖',
        sections: [
            {
                type: 'hero',
                headline: 'Just something I don\'t say enough',
                sub: 'Some words for you Mom'
            },
             {
                type: 'who',
                headline: 'What I see in you',
                text: 'When I see you Mom, I see a lady who has a lot of love to give. You have a heart that is drawn to helping people. I see a generous heart not afraid to give to others. I see a woman that always goes for what she wants and is not afraid to work hard.'
            },
            {
                type: 'message',
                sub: 'What do you need to remember?',
                text: "You are not a bad mother. I know sometimes it feels as though we shut you down and don\'t listen or believe you don't care. In those moments were acting from a place of experience and not from a place of embracing or accommodating the person that you are today. So... just always remember that you are loved and we do care about you and see you. You are an inspiration in the way you live, build, invest and help others. So may you keep shining your light. Even as you retire, you are just transitioning to a new phase of purpose. Your not losing an identity, your just stretching to see what more you have to offer. God is faithful and is with you. Having seen you this far He will surely continue to carry you forward."
            },
            {
                type: 'memory',
                label: 'What I carry with me... that came from you',
                text: "In certain scenarios and situations, it's easy for me to give, to be generous and kind. This comes as a trait that I've observed from you.Even my dressing.You are the first person to inspire me to dress well, even though our styles may differ, it extends from you."

            },
            {
                type: 'closing',
                text: 'My prayer for you', 
                line: "May God lead you as you transition into a new phase of life. May He guide you into the paths you should take and direct you in every way and situation. May He bless your health and preserve you.",
                cta: 'Share this card'

            }
            
        ]
    },
     {
        id: 'for_Joy',
        recipient: 'Joy',
        theme: 'blue',
        emoji: '💙',
        sections: [
            {
                type: 'hero',
                headline: 'I just wanted you to know',
                sub: 'Just a thought about you'
            },
             {
                type: 'who',
                headline: 'What I see in you',
                text: 'I see beauty and resilience. Despite all that you have been through you keep showing up, you keep on trying, you keep on going. You are a brave, strong soul.'
            },
            {
                type: 'message',
                sub: 'What do you need to remember?',
                text: "Remeber that your never alone. You have a family - people around you who genuinely care and want to know what's going on in your life. So never shy away from being open and telling us about  your experinces, all that you go through and are facing. Don't forget that you are loved and valued and craeted for such a wonderful purpose. You are a gift , the first to pave the way for us as our eldest sister. There is nothing that you can't face with God on your side. All things will work out."
            },
            {
                type: 'memory',
                label: 'What I carry with me... that came from you',
                text: "You give me a lot of fancy thimgs. I know sometimes inakaanga like I don't value them but I just want ou to know I do. The way you give me is the same I do for all of you through the small things I can. So this is from me to you."

            },
            {
                type: 'closing',
                text: 'My prayer for you', 
                line: "May god continue to restore you and bless you. May He shoe you the path He has for you. May you find rest in who He says you are.",
                cta: 'Share this card'

            }
            
        ]
    },
        {
        id: 'for_Wairimu',
        recipient: 'Wairimu',
        theme: 'bubbly',
        emoji: '💃😼',
        sections: [
            {
                type: 'hero',
                headline: 'Of the many conversation we have, this one is is special',
                sub: 'From me to you'
            },
             {
                type: 'who',
                headline: 'What I see in you',
                text: 'I beautiful rebellion. Your refusal to be chained down by a world you didn\'t want and choosing to chart your own path. I see boldness. The boldness that is rare and admirable. I see someone always pursuing a life that is worth more. A beautiful soul to be around'
            },
            {
                type: 'message',
                sub: 'What do you need to remember?',
                text: "Remember that Love will find you, it's not something you need to chase or worry about. If it takes time, you already have a big cake of wonderful people don't let the missing cherry make you forget the cake. You are walking in the things you once wished for. Being an entreprenuer, researcher, data analyst, sister and daughter is not easy but someohow you are doing it and it may not always be perfect .... you are human you know. So ata wewe when things get heavy ask for help and keep looking forward. And lastly SEE YOURSELF CLEARLY."
            },
            {
                type: 'memory',
                label: 'What I carry with me... that came from you',
                text: "We've been through a lot together, the moment though I'd say I carry the most is you taking your time to take me out after every midterm and endterm. I neve said it, but school used to be really tough  having that outing and just not needing to think about school really lightened the weight"

            },
            {
                type: 'closing',
                text: 'My prayer for you', 
                line: "May you find what your looking for and along the way discover God who satisfies. May you find love that embraces you, protects you and doesn't make you second guess yourself. May you continue to flourish",
                cta: 'Share this card'

            }
            
        ]
    },
    
        {
        id: 'for_Lin',
        recipient: 'Lin',
        theme: 'arsenal',
        emoji: '⚽ 🐶',
        sections: [
            {
                type: 'hero',
                headline: 'To my one and only brother',
                sub: 'This is my honest opinion about you'
            },
             {
                type: 'who',
                headline: 'What I see in you',
                text: "Let me just start by saying, you are the most handsome man ever. Kama haujawahi ambiwa just know. I see you as a really determined person, able to work hard to achieve all that they want. Someone who deeply loves and cares even if at times it may be hard to show it. A person always wanting to improve themselves."
            },
            {
                type: 'message',
                sub: 'What do you need to remember?',
                text: "Remember tha you don't need to prove yourself to anyone. You are just amazing as you are, wonderful as you are and may you never lose that. I always believe Lin you carry so much and I want you to see that. There's so much you will & can accomplish, theres's so much you have to offer. When I think of you I see greatness that is just waiting to be revealed to the world. So never forget that you are special, deeply known by the Creator for a purpose and deeply loved."
            },
            {
                type: 'memory',
                label: 'What I carry with me... that came from you',
                text: "Honestly it felt so sweet that I was the first person to meet your girlfriend. It's sweet that you were okay with me being with the two of you. It made me happy and made me feel that you actually want me to see into your life."

            },
            {
                type: 'closing',
                text: 'My prayer for you', 
                line: "May you see yourself as the creator sees you - see yourself CLEARLY. May you continue to grow into the person that you wnat to be and may God guide you. May God show Himself to you in a big way. May you live a prosperous life",
                cta: 'Share this card'

            }
            
        ]
    }
]