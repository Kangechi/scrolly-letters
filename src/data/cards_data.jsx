/* 
This is the 'database':
Basically it stores the structure of what is in the card
So that the user can type their own stuff, edit & send it to the person
*/

export const cardData = [
    {
        id: 'friend',
        recipient: 'Friend',
        theme: 'hue',
        emoji: '👓',
        sections: [
            {
                type: 'hero',
                headline: 'Happy Birthday Bianca 🌟',
                sub: 'To the friend that I can freely open up to'
            },
            {
                type: 'message',
                text: "Your a brave and inspiring soul, that keeps persevering and pushing despite all that comes her way"
            },
            {
                type: 'memory',
                label: 'A moment I carry',
                description: 'Describe a specific memory here'
            },
            {
                type: 'closing',
                line: `I'm rooting for you`,
                cta: 'Share this card'
            }
        ]
    },
    {
        id: 'friend_2',
        recipient: 'Baraka',
        theme: 'mint',
        emoji: '🐵',
        sections: [
            {
            type: 'hero',
            headline: 'Happy Birthday Baraka 🥳',
            sub: 'To the friend who always reaches out'
            },
            {
                type: 'message',
                text: 'To the person who is alwyas seeking God and seeks to always improve themselves'
            },
            {
                type: 'memory',
                label: 'A moment I carry',
                description: 'Describe the memory here'

            },
            {
                type: 'closing',
                line: 'I wish you the best in this new season',
                cta: 'Share this card'

            }


 
       ]
    }
]