import scrape from 'scrape-it-core';
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';

const episodesQuery = {
  seasons: {
    listItem: 'tr:has(th)',
    data: {
      title: 'th',
      episodes: {
        how: element => {
          let episodes = [];
          let curr = element['0'].next;
          for (; ;) {
            // End of list
            if (!curr)
              break;

            // select only tag elements
            if (curr.children) {

              if (curr.children[0].name === 'td') {
                episodes.push({
                  number: parseInt(curr.children[0].children[0].data.slice(0, -1), 10),
                  title: curr.children[1].children[0].children[0].data,
                  link: curr.children[1].children[0].attribs.href,
                });
              } else if (curr.children[0].name === 'th') {
                // Another season entry
                break;
              }
            }

            // Continue to traverse the tree
            curr = curr.next;
          }
          return episodes;
        },
      },
    },
  },
};

const scenesQuery = {
  scenes: {
    listItem: '.scene',
    data: {
      situation: '.situation',
      entries: {
        listItem: '.phrase',
        data: {
          type: {
            how: element => {
              return element['0'].attribs.class.slice(7);
            },
          },
          who: '.personnage',
          text: {
            selector: '.contenu',
          },
        },
      },
    },
  },
};

const res = await fetch('https://www.missabrevis.com/codex/episodes/');
if (!res.ok) {
  console.log('Not ok');
} else {
  const data = scrape(await res.text(), episodesQuery);
  let count = 0;
  await Promise.all(data.seasons.map(season => season.episodes.map(episode => {
        // Random delay before each request to not overload the server all at once
        return (async () => {
          await setTimeout(Math.random() * 60000);
          console.log(`${++count} : ${episode.link}`);
          const res = await fetch(`https://www.missabrevis.com${episode.link}`);
          if (res.ok) {
            episode.script = scrape(await res.text(), scenesQuery);
          } else {
            throw new Error(`Request dropped : ${res.status} ${res.statusText} ${res.url}`);
          }
        })();
      }),
  ).flat());
  await fs.writeFile('kaamelott.json', JSON.stringify(data));
}
