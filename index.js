import scrapeIt from 'scrape-it';
import fs from 'fs/promises';

scrapeIt('https://www.missabrevis.com/codex/episodes/',
    {
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
                      number: parseInt(
                          curr.children[0].children[0].data.slice(0, -1), 10),
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
    }).
    then(async (res) => {
      let count = 0;
      await Promise.all(res.data.seasons.map(
          season => season.episodes.map(episode => {
            console.log(`req : ${++count}`)
                return scrapeIt(`https://www.missabrevis.com${episode.link}`, {
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
                }).then(res => episode.script = res.data).catch(console.log);
              },
          )).flat());
      return res.data;
    }).
    then(data =>
        fs.writeFile('kaamelott.json', JSON.stringify(data))).
    catch(console.log);
