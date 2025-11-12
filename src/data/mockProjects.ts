import { Project } from "@/types/project";
import projectSolar from "@/assets/project-solar.jpg";
import projectGarden from "@/assets/project-garden.jpg";
import projectEducation from "@/assets/project-education.jpg";
import projectWater from "@/assets/project-water.jpg";

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Solarna Elektrarna za Lokalno Skupnost",
    description: "Gradnja sončne elektrarne za samooskrbo lokalne skupnosti z zeleno energijo. Projekt bo zmanjšal stroške energije za 40% in prispeval k zmanjšanju ogljikovega odtisa.",
    image: projectSolar,
    goal: 50000,
    raised: 32450,
    backers: 127,
    daysLeft: 15,
    category: "Energija",
    creator: "EkoInovacije d.o.o."
  },
  {
    id: "2",
    title: "Urbani Vrt za Mestno Četrt",
    description: "Postavitev komunitnega vrta v mestnem središču, kjer bodo prebivalci skupaj gojili ekološko zelenjavo in zelišča. Vključuje vertikalne vrtove in izobraževalne delavnice.",
    image: projectGarden,
    goal: 15000,
    raised: 12800,
    backers: 89,
    daysLeft: 8,
    category: "Ekologija",
    creator: "Zelena Ljubljana"
  },
  {
    id: "3",
    title: "Programiranje za Otroke",
    description: "Brezplačni tečaji programiranja in robotike za otroke iz socialno šibkejših družin. Projekt bo omogočil dostop do sodobnega tehnološkega znanja za 200 otrok.",
    image: projectEducation,
    goal: 25000,
    raised: 18650,
    backers: 156,
    daysLeft: 22,
    category: "Izobraževanje",
    creator: "Digitalna Prihodnost"
  },
  {
    id: "4",
    title: "Čista Pitna Voda za Vasi v Afriki",
    description: "Izgradnja vodnjakov in sistema za čiščenje vode v treh vaseh v vzhodni Afriki. Projekt bo zagotovil čisto pitno vodo za več kot 1500 prebivalcev.",
    image: projectWater,
    goal: 40000,
    raised: 8420,
    backers: 45,
    daysLeft: 30,
    category: "Humanitarno",
    creator: "Vode za Vse"
  }
];
