import fs from 'fs';
import path from 'path';
import { runStaticClickabilityAudit } from './clickabilityHarness.js';

function runCli() {
  console.log('=============== VANTI CLICKABILITY REGRESSION CHECKER ===============');
  
  try {
    const rootDir = process.cwd();
    const globalShellPath = path.join(rootDir, 'src', 'components', 'VantiGlobalShell.tsx');
    
    if (!fs.existsSync(globalShellPath)) {
      console.warn('⚠️ Warning: VantiGlobalShell.tsx not found. Skipping static source audit.');
      process.exit(0);
    }
    
    const sourceContent = fs.readFileSync(globalShellPath, 'utf8');
    const audit = runStaticClickabilityAudit(sourceContent);
    
    audit.messages.forEach(msg => {
      console.log(msg.startsWith('PASS') ? `✅ ${msg}` : `❌ ${msg}`);
    });
    
    if (!audit.success) {
      console.error('💥 CLICKABILITY REGRESSION CHECK FAILED!');
      process.exit(1);
    }
    
    console.log('✅ ALL INTERACTIVE MAP OVERLAYS CONFIGURED CORRECTLY. SAFE-BY-DEFAULT.');
    console.log('=====================================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Clickability verification failed with error:', error.message);
    process.exit(1);
  }
}

runCli();
