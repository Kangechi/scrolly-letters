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
        section: [
            {
                type: 'safe space',
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
    }
]