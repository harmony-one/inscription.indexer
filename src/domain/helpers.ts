export enum URL_TYPE {
    TWITTER = 'twitter',
    NOTION = 'notion',
    SUBSTACK = 'substack',
}

export const getTypeByUrl = (url: string) => {
    let type;

    if (url.includes('twitter.com') || url.includes('x.com')) {
        type = 'twitter';
    }

    if (url.includes('notion.com') || url.includes('notion.site')) {
        type = 'notion';
    }

    if (url.includes('substack.com')) {
        type = 'substack';
    }

    return type;
}