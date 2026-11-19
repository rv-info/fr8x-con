const fs = require('fs');
const filePath = 'app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('useTheme()')) {
  content = content.replace(
    '  const { user } = useAuth();',
    '  const { user } = useAuth();\n  const { theme, occasionGreeting } = useTheme();'
  );
}

const targetBadge = `{user.plan.toUpperCase()} PLAN\n              </span>`;
const targetBadgeCrlf = `{user.plan.toUpperCase()} PLAN\r\n              </span>`;

const addition = `\n              {occasionGreeting && (\n                <span className="badge amber" style={{ fontSize: '10px', background: theme.colors.activeBackground, color: theme.colors.primary, borderColor: theme.colors.borderPrimary }}>\n                  {occasionGreeting}\n                </span>\n              )}`;

if (content.includes(targetBadgeCrlf)) {
  content = content.replace(targetBadgeCrlf, targetBadgeCrlf + addition);
} else if (content.includes(targetBadge)) {
  content = content.replace(targetBadge, targetBadge + addition);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard theme integration updated successfully.');
