import 'dotenv/config'
import { promoteUserToAdmin } from '../app/models/admin'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run admin:promote -- <email>')
  process.exit(1)
}

try {
  const result = await promoteUserToAdmin(email)
  if (result.status === 'already_admin') {
    console.log(`Already admin: ${result.email}`)
  } else {
    console.log(`Promoted to admin: ${result.email}`)
  }
  process.exit(0)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(message)
  process.exit(1)
}
