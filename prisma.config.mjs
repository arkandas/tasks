import 'dotenv/config'

const config = {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.TASKS_DATABASE_URL,
  },
}

export default config
