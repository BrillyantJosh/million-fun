import { Project } from "@/types/project";
import projectSolar from "@/assets/project-solar.jpg";
import projectGarden from "@/assets/project-garden.jpg";
import projectEducation from "@/assets/project-education.jpg";
import projectWater from "@/assets/project-water.jpg";

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Solar Power Plant for Local Community",
    description: "Construction of a solar power plant for self-sufficiency of the local community with green energy. The project will reduce energy costs by 40% and contribute to reducing the carbon footprint.",
    image: projectSolar,
    goal: 50000,
    raised: 32450,
    backers: 127,
    daysLeft: 15,
    category: "Energy",
    creator: "EcoInnovations Ltd."
  },
  {
    id: "2",
    title: "Urban Garden for City District",
    description: "Setting up a community garden in the city center, where residents will grow organic vegetables and herbs together. Includes vertical gardens and educational workshops.",
    image: projectGarden,
    goal: 15000,
    raised: 12800,
    backers: 89,
    daysLeft: 8,
    category: "Ecology",
    creator: "Green Ljubljana"
  },
  {
    id: "3",
    title: "Programming for Children",
    description: "Free programming and robotics courses for children from socially disadvantaged families. The project will provide access to modern technological knowledge for 200 children.",
    image: projectEducation,
    goal: 25000,
    raised: 18650,
    backers: 156,
    daysLeft: 22,
    category: "Education",
    creator: "Digital Future"
  },
  {
    id: "4",
    title: "Clean Drinking Water for Villages in Africa",
    description: "Construction of wells and water purification system in three villages in East Africa. The project will provide clean drinking water for more than 1,500 residents.",
    image: projectWater,
    goal: 40000,
    raised: 8420,
    backers: 45,
    daysLeft: 30,
    category: "Humanitarian",
    creator: "Water for All"
  }
];
