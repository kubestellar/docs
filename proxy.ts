export { proxy } from 'nextra/locales'
 
export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: [
    '/((?!docs|api|_next|_vercel|agenda|blog|code|community|drive|infomercial|join_us|joinus|ladder|ladder_stats|linkedin|quickstart|slack|survey|tv|youtube|.*\\..*).*)', 

//    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)'
  ]
}