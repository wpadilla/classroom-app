import {IClassroom} from "../models/clasroomModel";
import {IEvaluation} from "../App";
import {generateCustomID} from "../utils/generators";

export const mockClassrooms: () => { data: IClassroom[] } = () => ({
    data: [
        {
            id: generateCustomID(),
            subject: "Sanidad interior",
            teacher: {
                id: generateCustomID(),
                firstName: "Elizabeth",
                lastName: "Ramos",
                phone: "18295623591", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Ronny E.",
                    lastName: "Peña",
                    phone: "18298170911",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Rosibel",
                    lastName: "Rincón",
                    phone: "18498692395",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Eddy",
                    lastName: "Hernández",
                    phone: "18093703528",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Emiliana",
                    lastName: "Santos",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Bernard",
                    lastName: "Haro",
                    phone: "18292631468",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Geri",
                    lastName: "Cuevas",
                    phone: "18295147438",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Carlos",
                    lastName: "Mojica",
                    phone: "18098750096",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Stefani",
                    lastName: "Paola",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Gissel",
                    lastName: "Feliz Álvarez",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Aracelis",
                    lastName: "Solano",
                    phone: "18296626381",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Marisol",
                    lastName: "Guerrero",
                    phone: "18092081366",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Massiel",
                    lastName: "Encarnación",
                    phone: "18094044235",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Ronny",
                    lastName: "Américo",
                    phone: "18298170911",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Carlos",
                    lastName: "Mejía M.",
                    phone: "18497639939",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Lidia",
                    lastName: "Upia Feliz",
                    phone: "18296603338",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Aline",
                    lastName: "Jacquez",
                    phone: "18494636902",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                }
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 200 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Sean 1",
            teacher: {
                id: generateCustomID(),
                firstName: "Williams",
                lastName: "Padilla",
                phone: "18094055531", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Karen",
                    lastName: "Carrasquel",
                    phone: "18092701995",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Carlos",
                    lastName: "Betances",
                    phone: "18094987523",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "María",
                    lastName: "Núñez",
                    phone: "18296867780",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Salomón",
                    lastName: "Álvarez",
                    phone: "18295870899",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Andersón",
                    lastName: "Montero",
                    phone: "18299438173",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yenifer",
                    lastName: "José",
                    phone: "18492565660",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Sucely",
                    lastName: "de la Rosa",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Randy",
                    lastName: "De la Rosa",
                    phone: "18295490211",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yohanni",
                    lastName: "de Jesús",
                    phone: "18292761184",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Franklin",
                    lastName: "Candelario",
                    phone: "18292612557",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Francia",
                    lastName: "Ferrer",
                    phone: "18295794315",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Priscilla",
                    lastName: "Díaz",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Erika",
                    lastName: "Sánchez",
                    phone: "18096986045",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Aniuberca",
                    lastName: "Bonilla",
                    phone: "18296611019",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Raisa",
                    lastName: "Moronta",
                    phone: "18296338536",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Patricia",
                    lastName: "B",
                    phone: "18296826397",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Shenny",
                    lastName: "Vásquez",
                    phone: "18095439495",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Lovelande",
                    lastName: "",
                    phone: "18295271659",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Roselys",
                    lastName: "",
                    phone: "18096931531",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Douglas",
                    lastName: "",
                    phone: "18296960973",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Verónica",
                    lastName: "",
                    phone: "18099909051",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Braudy",
                    lastName: "",
                    phone: "18094455487",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Woodmica",
                    lastName: "Forescal",
                    phone: "1",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Cristian",
                    lastName: "Ovalles",
                    phone: "18293181676",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yirandy",
                    lastName: "Adames",
                    phone: "18294447415",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 350 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Sean 2",
            teacher: {
                id: generateCustomID(),
                firstName: "Ronny",
                lastName: "Polanco",
                phone: "18496281692", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Josué A.",
                    lastName: "Puntiel",
                    phone: "18499128020",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Santa",
                    lastName: "Jacinto",
                    phone: "18498683903",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Alexi J.",
                    lastName: "Hernández",
                    phone: "18098187324",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Gabriela",
                    lastName: "Arias",
                    phone: "18297935696",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Tania",
                    lastName: "Castro",
                    phone: "18099496021",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Steysi",
                    lastName: "Castillo",
                    phone: "18097601567",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Daneisis N.",
                    lastName: "Jacobs",
                    phone: "18093710879",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Fabian",
                    lastName: "Castillo",
                    phone: "18498585523",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Reyna",
                    lastName: "Reyes",
                    phone: "18296580474",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Ramón",
                    lastName: "de la cruz",
                    phone: "18094138149",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yohanna",
                    lastName: "López",
                    phone: "18096727725",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yeidi",
                    lastName: "Feliz Cueva",
                    phone: "18299341767",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Irene",
                    lastName: "Castro Núñez",
                    phone: "18099496021",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                }
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 350
        },
        {
            id: generateCustomID(),
            subject: "Sean 3",
            teacher: {
                id: generateCustomID(),
                firstName: "Luz",
                lastName: "Peña",
                phone: "18096440038", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Verónica",
                    lastName: "Mateo",
                    phone: "18299678218",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Emely",
                    lastName: "Columna",
                    phone: "18496531893",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Maribel",
                    lastName: "Frometa",
                    phone: "18094088988",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Silvio",
                    lastName: "Soto",
                    phone: "18092171859",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Isaac",
                    lastName: "de la Cruz",
                    phone: "18299812894",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Lourdes",
                    lastName: "",
                    phone: "",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "María Josefina",
                    lastName: "Feliz",
                    phone: "18298617801",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yahaira",
                    lastName: "Cruceta",
                    phone: "18099934631",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Vickiana",
                    lastName: "Elvera",
                    phone: "18092826648",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Elena",
                    lastName: "Elvera",
                    phone: "18092826648",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Eliel Moisés",
                    lastName: "Ferrer",
                    phone: "18097130033",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Princesa",
                    lastName: "Jacquez",
                    phone: "18494636902",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Felix Manuel",
                    lastName: "De la Rosa",
                    phone: "18497546991",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Chantal",
                    lastName: "Agustín",
                    phone: "18498172491",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yocasta",
                    lastName: "",
                    phone: "18498762257",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Rosangeles",
                    lastName: "Campusano",
                    phone: "18092167958",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                }
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 350 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Sean 4",
            teacher: {
                id: generateCustomID(),
                firstName: "Magalys",
                lastName: "Guerrero",
                phone: "18094085238", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Aidé",
                    lastName: "Pérez",
                    phone: "18298434913",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Andreina",
                    lastName: "Batista",
                    phone: "18098990947",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Aneudy",
                    lastName: "Sánchez",
                    phone: "18296585152",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Elibeth",
                    lastName: "Encarnación",
                    phone: "18293868173",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Vanessa",
                    lastName: "Paniagua",
                    phone: "18498812959",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Johemi",
                    lastName: "Pérez",
                    phone: "18094984807",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Santa",
                    lastName: "Monica",
                    phone: "18098537857",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Dahianny",
                    lastName: "Diaz",
                    phone: "18099563261",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Gloria",
                    lastName: "Félix",
                    phone: "18296019355",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 350 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Sean 6",
            teacher: {
                id: generateCustomID(),
                firstName: "Moisés",
                lastName: "Ferrer",
                phone: "18099402441", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Maribel",
                    lastName: "Andersón",
                    phone: "18298779181",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Kany",
                    lastName: "Rosario",
                    phone: "18298083622",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Wilnelia",
                    lastName: "Binet",
                    phone: "18295094971",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Freddy",
                    lastName: "Castillo",
                    phone: "18498585523",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Kirsis",
                    lastName: "Rodríguez",
                    phone: "18097601567",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Ligia",
                    lastName: "Ventura",
                    phone: "18099456042",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Milcíades",
                    lastName: "",
                    phone: "18094091271",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Alba",
                    lastName: "Paniagua",
                    phone: "18093019792",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "María Ester",
                    lastName: "Montero",
                    phone: "18099290700",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yudith",
                    lastName: "Polanco",
                    phone: "18296549847",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Hilary",
                    lastName: "Marte",
                    phone: "18096130547",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Jaqueline",
                    lastName: "Jiménez",
                    phone: "18492228077",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yamilet",
                    lastName: "mercedes",
                    phone: "18299831817",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Jorgelina",
                    lastName: "Encarnación",
                    phone: "18093161234",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Aracelis",
                    lastName: "Brea",
                    phone: "18297227405",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Sory",
                    lastName: "Mora",
                    phone: "18099357447",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Susana",
                    lastName: "",
                    phone: "18098773475",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Kelvin",
                    lastName: "Campusano",
                    phone: "18093088112",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Evelyn",
                    lastName: "Vásquez",
                    phone: "18092980873",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Dary",
                    lastName: "Perdomo",
                    phone: "18292628519",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Marianela",
                    lastName: "Consuelo",
                    phone: "18496547773",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 350 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Taller de Predicación",
            teacher: {
                id: generateCustomID(),
                firstName: "Rudiver",
                lastName: "Victoriano",
                phone: "18296469798", // Assuming phone number for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Freddy",
                    lastName: "Felix",
                    phone: "18096097636",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Enrique",
                    lastName: "Berliza",
                    phone: "18298771864",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Pamela",
                    lastName: "Suero",
                    phone: "18095095495",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Elías",
                    lastName: "Sepúlveda",
                    phone: "18297875461",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Vanessa R.",
                    lastName: "Alcántara",
                    phone: "18298143815",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Sahíra",
                    lastName: "Reyes",
                    phone: "18492275212",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Wilbert",
                    lastName: "Padilla",
                    phone: "18094045531",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Jean Leave",
                    lastName: "Felix",
                    phone: "18099781058",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Williams",
                    lastName: "Frías",
                    phone: "18294133888",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Harold",
                    lastName: "Mella",
                    phone: "18099886556",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yeuri",
                    lastName: "Peña",
                    phone: "",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                }
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 600 // Assuming no material price is specified
        },
        {
            id: generateCustomID(),
            subject: "Libro Especial",
            teacher: {
                id: generateCustomID(),
                firstName: "Loida",
                lastName: "Saldaña",
                phone: "18299431984", // Assuming no phone number provided for the teacher
                role: "teacher"
            },
            students: [
                {
                    id: generateCustomID(),
                    firstName: "Grecia",
                    lastName: "Tapia",
                    phone: "18292082253",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Noemí",
                    lastName: "Heredia",
                    phone: "18293088897",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Guerlis",
                    lastName: "Pérez",
                    phone: "18097079637",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Modesta",
                    lastName: "Rodríguez",
                    phone: "18498791083",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Darío",
                    lastName: "Sierra",
                    phone: "18299599475",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Dorcas",
                    lastName: "Heredia",
                    phone: "18295242275",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Elizabeth",
                    lastName: "De Luna",
                    phone: "18099131312",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Nidia",
                    lastName: "López",
                    phone: "18099942880",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "José Antonio",
                    lastName: "Vásquez",
                    phone: "18098848012",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Carmen",
                    lastName: "Aquino",
                    phone: "18295850466",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Fiordaliza",
                    lastName: "Ferreras",
                    phone: "18096478275",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Andrés",
                    lastName: "Travieso",
                    phone: "18098991137",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Lisset",
                    lastName: "Paulino",
                    phone: "18293745210",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Yoan",
                    lastName: "Gerónimo",
                    phone: "18097610778",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "María",
                    lastName: "Pérez",
                    phone: "18494035898",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Ruth",
                    lastName: "Saldaña",
                    phone: "18295774579",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Liliana",
                    lastName: "Santana",
                    phone: "18298853145",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                },
                {
                    id: generateCustomID(),
                    firstName: "Saraí",
                    lastName: "Feliz",
                    phone: "18099016559",
                    role: "student",
                    evaluation: {} as any,
                    assistance: []
                }
            ],
            classes: [
                {
                    id: generateCustomID(),
                    name: "Semana 1",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 2",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 3",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 4",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 5",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 6",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 7",
                    date: new Date()
                },
                {
                    id: generateCustomID(),
                    name: "Semana 8",
                    date: new Date()
                }
            ],
            materialPrice: 250
        },
    ]
});
