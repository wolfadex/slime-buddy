import { Elm } from './Main.elm';

const saveKey = 'wolfadex_slime-buddy';
const savedSlime = localStorage.getItem(saveKey);
let savedData;

try {
  savedData = JSON.parse(savedSlime);
} catch (e) {
  // Placeholder
}

const app = Elm.Main.init({ flags: savedData });

app.ports.save &&
  app.ports.save.subscribe((slime) => {
    localStorage.setItem(saveKey, JSON.stringify(slime));
  });
