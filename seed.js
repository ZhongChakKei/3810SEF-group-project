/**
 * Sample Data Seeder for Liverpool FC Players
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Update MONGODB_URI if needed
 * 3. Run: node seed.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'project_sample';

const samplePlayers = [
  {
    name: 'Alisson Becker',
    position: 'Goalkeeper',
    squadNumber: 1,
    nationality: 'Brazil',
    heightCm: 193,
    dateOfBirth: new Date('1992-10-02'),
    stats: { appearances: 180, goals: 0, assists: 2, minutes: 16200 },
    tags: ['World Class', 'Golden Glove'],
    createdAt: new Date()
  },
  {
    name: 'Trent Alexander-Arnold',
    position: 'Defender',
    squadNumber: 66,
    nationality: 'England',
    heightCm: 180,
    dateOfBirth: new Date('1998-10-07'),
    stats: { appearances: 250, goals: 15, assists: 70, minutes: 21000 },
    tags: ['Local Lad', 'Playmaker', 'Young Star'],
    createdAt: new Date()
  },
  {
    name: 'Virgil van Dijk',
    position: 'Defender',
    squadNumber: 4,
    nationality: 'Netherlands',
    heightCm: 195,
    dateOfBirth: new Date('1991-07-08'),
    stats: { appearances: 200, goals: 18, assists: 8, minutes: 17800 },
    tags: ['Captain', 'World Class', 'Rock'],
    createdAt: new Date()
  },
  {
    name: 'Andy Robertson',
    position: 'Defender',
    squadNumber: 26,
    nationality: 'Scotland',
    heightCm: 178,
    dateOfBirth: new Date('1994-03-11'),
    stats: { appearances: 220, goals: 7, assists: 50, minutes: 19500 },
    tags: ['Captain Material', 'Consistent'],
    createdAt: new Date()
  },
  {
    name: 'Alexis Mac Allister',
    position: 'Midfielder',
    squadNumber: 10,
    nationality: 'Argentina',
    heightCm: 176,
    dateOfBirth: new Date('1998-12-24'),
    stats: { appearances: 45, goals: 8, assists: 6, minutes: 3800 },
    tags: ['World Cup Winner', 'Versatile'],
    createdAt: new Date()
  },
  {
    name: 'Dominik Szoboszlai',
    position: 'Midfielder',
    squadNumber: 8,
    nationality: 'Hungary',
    heightCm: 186,
    dateOfBirth: new Date('2000-10-25'),
    stats: { appearances: 40, goals: 7, assists: 5, minutes: 3200 },
    tags: ['Dynamic', 'Young Talent'],
    createdAt: new Date()
  },
  {
    name: 'Mohamed Salah',
    position: 'Forward',
    squadNumber: 11,
    nationality: 'Egypt',
    heightCm: 175,
    dateOfBirth: new Date('1992-06-15'),
    stats: { appearances: 300, goals: 210, assists: 85, minutes: 25000 },
    tags: ['Legend', 'Goal Machine', 'Egyptian King'],
    createdAt: new Date()
  },
  {
    name: 'Darwin Núñez',
    position: 'Forward',
    squadNumber: 9,
    nationality: 'Uruguay',
    heightCm: 187,
    dateOfBirth: new Date('1999-06-24'),
    stats: { appearances: 80, goals: 35, assists: 15, minutes: 6000 },
    tags: ['Striker', 'Physical'],
    createdAt: new Date()
  },
  {
    name: 'Luis Díaz',
    position: 'Forward',
    squadNumber: 7,
    nationality: 'Colombia',
    heightCm: 180,
    dateOfBirth: new Date('1997-01-13'),
    stats: { appearances: 90, goals: 25, assists: 18, minutes: 7000 },
    tags: ['Tricky', 'Exciting'],
    createdAt: new Date()
  },
  {
    name: 'Cody Gakpo',
    position: 'Forward',
    squadNumber: 18,
    nationality: 'Netherlands',
    heightCm: 189,
    dateOfBirth: new Date('1999-05-07'),
    stats: { appearances: 60, goals: 22, assists: 12, minutes: 4800 },
    tags: ['Versatile', 'Clinical'],
    createdAt: new Date()
  }
];

async function seed() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const playersCollection = db.collection('players');
    
    // Check if collection already has data
    const count = await playersCollection.countDocuments();
    
    if (count > 0) {
      console.log(`⚠️  Collection already has ${count} players.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to clear and reseed? (yes/no): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelled.');
        return;
      }
      
      console.log('🗑️  Clearing existing data...');
      await playersCollection.deleteMany({});
    }
    
    console.log('🌱 Seeding sample players...');
    const result = await playersCollection.insertMany(samplePlayers);
    
    console.log(`✅ Successfully seeded ${result.insertedCount} players!`);
    console.log('\nSample players added:');
    samplePlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. #${player.squadNumber} ${player.name} (${player.position})`);
    });
    
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the seeder
seed();
