import Link from 'next/link'
import { useRouter } from 'next/router'
import { createContext, forwardRef, useRef } from 'react'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import clsx from 'clsx'
import { SearchButton } from '@/components/Search'
import { Dialog } from '@headlessui/react'

export const SidebarContext = createContext()

const NavItem = forwardRef(({ href, children, isActive, isPublished, fallbackHref }, ref) => {
  return (
    <li ref={ref} data-active={isActive ? 'true' : undefined}>
      <Link href={isPublished ? href : fallbackHref}>
        <a
          className={clsx('block border-l pl-4 -ml-px', {
            'text-sky-500 border-current font-semibold dark:text-sky-400': isActive,
            'border-transparent hover:border-slate-400 dark:hover:border-slate-500': !isActive,
            'text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300':
              !isActive && isPublished,
            'text-slate-400': !isActive && !isPublished,
          })}
        >
          {children}
        </a>
      </Link>
    </li>
  )
})

/**
 * Find the nearst scrollable ancestor (or self if scrollable)
 *
 * Code adapted and simplified from the smoothscroll polyfill
 *
 *
 * @param {Element} el
 */
function nearestScrollableContainer(el) {
  /**
   * indicates if an element can be scrolled
   *
   * @param {Node} el
   */
  function isScrollable(el) {
    const style = window.getComputedStyle(el)
    const overflowX = style['overflowX']
    const overflowY = style['overflowY']
    const canScrollY = el.clientHeight < el.scrollHeight
    const canScrollX = el.clientWidth < el.scrollWidth

    const isScrollableY = canScrollY && (overflowY === 'auto' || overflowY === 'scroll')
    const isScrollableX = canScrollX && (overflowX === 'auto' || overflowX === 'scroll')

    return isScrollableY || isScrollableX
  }

  while (el !== document.body && isScrollable(el) === false) {
    el = el.parentNode || el.host
  }

  return el
}

function Nav({ nav, children, fallbackHref, mobile = false }) {
  const router = useRouter()
  const activeItemRef = useRef()
  const previousActiveItemRef = useRef()
  const scrollRef = useRef()

  useIsomorphicLayoutEffect(() => {
    function updatePreviousRef() {
      previousActiveItemRef.current = activeItemRef.current
    }

    if (activeItemRef.current) {
      if (activeItemRef.current === previousActiveItemRef.current) {
        updatePreviousRef()
        return
      }

      updatePreviousRef()

      const scrollable = nearestScrollableContainer(scrollRef.current)

      const scrollRect = scrollable.getBoundingClientRect()
      const activeItemRect = activeItemRef.current.getBoundingClientRect()

      const top = activeItemRef.current.offsetTop
      const bottom = top - scrollRect.height + activeItemRect.height

      if (scrollable.scrollTop > top || scrollable.scrollTop < bottom) {
        scrollable.scrollTop = top - scrollRect.height / 2 + activeItemRect.height / 2
      }
    }
  }, [router.pathname])

  return (
    <nav ref={scrollRef} id="nav" className="relative lg:text-sm lg:leading-6">
      <div className="sticky top-0 -ml-0.5 pointer-events-none">
        {!mobile && <div className="h-10 bg-white dark:bg-slate-900" />}
        <div className="relative bg-white pointer-events-auto dark:bg-slate-900">
          <SearchButton className="hidden w-full lg:flex items-center text-sm leading-6 text-slate-400 rounded-md ring-1 ring-slate-900/10 shadow-sm py-1.5 pl-2 pr-3 hover:ring-slate-300 dark:bg-slate-800 dark:highlight-white/5 dark:hover:bg-slate-700">
            {({ actionKey }) => (
              <>
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  aria-hidden="true"
                  className="flex-none mr-3"
                >
                  <path
                    d="m19 19-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Quick search...
                {actionKey && (
                  <span className="flex-none pl-3 ml-auto text-xs font-semibold">
                    {actionKey[0]}K
                  </span>
                )}
              </>
            )}
          </SearchButton>
        </div>
        {!mobile && <div className="h-8 bg-gradient-to-b from-white dark:from-slate-900" />}
      </div>
      <ul>
        <TopLevelNav mobile={mobile} />
        {children}
        {nav &&
          Object.keys(nav)
            .map((category) => {
              let publishedItems = nav[category].filter((item) => item.published !== false)
              if (publishedItems.length === 0 && !fallbackHref) return null
              return (
                <li key={category} className="mt-12 lg:mt-8">
                  <h5
                    className={clsx('mb-8 lg:mb-3 font-semibold', {
                      'text-slate-900 dark:text-slate-200': publishedItems.length > 0,
                      'text-slate-400': publishedItems.length === 0,
                    })}
                  >
                    {category}
                  </h5>
                  <ul
                    className={clsx(
                      'space-y-6 lg:space-y-2 border-l border-slate-100',
                      mobile ? 'dark:border-slate-700' : 'dark:border-slate-800'
                    )}
                  >
                    {(fallbackHref ? nav[category] : publishedItems).map((item, i) => {
                      let isActive = item.match
                        ? item.match.test(router.pathname)
                        : item.href === router.pathname
                      return (
                        <NavItem
                          key={i}
                          href={item.href}
                          isActive={isActive}
                          ref={isActive ? activeItemRef : undefined}
                          isPublished={item.published !== false}
                          fallbackHref={fallbackHref}
                        >
                          {item.shortTitle || item.title}
                        </NavItem>
                      )
                    })}
                  </ul>
                </li>
              )
            })
            .filter(Boolean)}
      </ul>
    </nav>
  )
}

const TopLevelAnchor = forwardRef(
  (
    { children, href, className, icon, isActive, onClick, shadow, activeBackground, mobile },
    ref
  ) => {
    return (
      <li>
        <a
          ref={ref}
          href={href}
          onClick={onClick}
          className={clsx(
            'group flex items-center lg:text-sm lg:leading-6',
            className,
            isActive
              ? 'font-semibold text-sky-500 dark:text-sky-400'
              : 'font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'
          )}
        >
          <div
            className={clsx(
              'mr-4 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:shadow group-hover:ring-slate-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10',
              shadow,
              isActive
                ? [activeBackground, 'dark:highlight-white/10']
                : mobile
                ? 'dark:bg-slate-700 dark:highlight-white/5'
                : 'dark:bg-slate-800 dark:highlight-white/5'
            )}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              {icon}
            </svg>
          </div>
          {children}
        </a>
      </li>
    )
  }
)

function TopLevelLink({ href, as, ...props }) {
  if (/^https?:\/\//.test(href)) {
    return <TopLevelAnchor href={href} {...props} />
  }

  return (
    <Link href={href} as={as} passHref>
      <TopLevelAnchor {...props} />
    </Link>
  )
}

function TopLevelNav({ mobile }) {
  let { pathname } = useRouter()

  return (
    <>
      <TopLevelLink
        mobile={mobile}
        href="/docs/installation"
        isActive={pathname.startsWith('/docs')}
        className="mb-4"
        shadow="group-hover:shadow-sky-200 dark:group-hover:bg-sky-500"
        activeBackground="dark:bg-sky-500"
        icon={
          <>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.5 7c1.093 0 2.117.27 3 .743V17a6.345 6.345 0 0 0-3-.743c-1.093 0-2.617.27-3.5.743V7.743C5.883 7.27 7.407 7 8.5 7Z"
              className={clsx(
                'fill-sky-200 group-hover:fill-sky-500',
                pathname.startsWith('/docs')
                  ? 'dark:fill-sky-300 dark:group-hover:fill-sky-300'
                  : 'dark:fill-slate-400 dark:group-hover:fill-sky-300'
              )}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.5 7c1.093 0 2.617.27 3.5.743V17c-.883-.473-2.407-.743-3.5-.743s-2.117.27-3 .743V7.743a6.344 6.344 0 0 1 3-.743Z"
              className={clsx(
                'fill-sky-400 group-hover:fill-sky-500',
                pathname.startsWith('/docs')
                  ? 'dark:fill-sky-200 dark:group-hover:fill-sky-200'
                  : 'dark:fill-slate-600 dark:group-hover:fill-sky-200'
              )}
            />
          </>
        }
      >
        Documentation
      </TopLevelLink>
      <TopLevelLink
        mobile={mobile}
        href="/resources"
        isActive={pathname === '/resources'}
        className="mb-4"
        shadow="group-hover:shadow-purple-200 dark:group-hover:bg-purple-400"
        activeBackground="dark:bg-purple-400"
        icon={
          <>
            <path
              d="M6 8a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8ZM6 15a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1Z"
              className={clsx(
                'fill-purple-400 group-hover:fill-purple-500 dark:group-hover:fill-purple-300',
                pathname === '/resources'
                  ? 'dark:fill-purple-300 dark:group-hover:fill-purple-300'
                  : mobile
                  ? 'dark:fill-slate-500'
                  : 'dark:fill-slate-600'
              )}
            />
            <path
              d="M13 8a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V8Z"
              className={clsx(
                'fill-purple-200 group-hover:fill-purple-300 dark:group-hover:fill-white',
                pathname === '/resources'
                  ? 'dark:fill-white dark:group-hover:fill-white'
                  : mobile
                  ? 'dark:fill-slate-300'
                  : 'dark:fill-slate-400'
              )}
            />
            <path
              d="M13 15a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-1Z"
              className={clsx(
                'fill-purple-400 group-hover:fill-purple-500 dark:group-hover:fill-purple-300',
                pathname === '/resources'
                  ? 'dark:fill-purple-300 dark:group-hover:fill-purple-300'
                  : mobile
                  ? 'dark:fill-slate-500'
                  : 'dark:fill-slate-600'
              )}
            />
          </>
        }
      >
        <span className={pathname === '/resources' ? 'dark:text-purple-400' : ''}>Resources</span>
      </TopLevelLink>
    </>
  )
}

function Wrapper({ allowOverflow, children }) {
  return <div className={allowOverflow ? undefined : 'overflow-hidden'}>{children}</div>
}

export function SidebarLayout({
  children,
  navIsOpen,
  setNavIsOpen,
  nav,
  sidebar,
  fallbackHref,
  layoutProps: { allowOverflow = true } = {},
}) {
  return (
    <SidebarContext.Provider value={{ nav, navIsOpen, setNavIsOpen }}>
      <Wrapper allowOverflow={allowOverflow}>
        <div className="px-4 mx-auto max-w-8xl sm:px-6 md:px-8">
          <div className="hidden lg:block fixed z-20 inset-0 top-[3.8125rem] left-[max(0px,calc(50%-45rem))] right-auto w-[19.5rem] pb-10 px-8 overflow-y-auto">
            <Nav nav={nav} fallbackHref={fallbackHref}>
              {sidebar}
            </Nav>
          </div>
          <div className="lg:pl-[19.5rem]">{children}</div>
        </div>
      </Wrapper>
      <Dialog
        as="div"
        open={navIsOpen}
        onClose={() => setNavIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto lg:hidden"
      >
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80" />
        <div className="relative bg-white w-80 max-w-[calc(100%-3rem)] p-6 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setNavIsOpen(false)}
            className="absolute z-10 flex items-center justify-center w-8 h-8 top-5 right-5 text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <span className="sr-only">Close navigation</span>
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 overflow-visible">
              <path
                d="M0 0L10 10M10 0L0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Nav nav={nav} fallbackHref={fallbackHref} mobile={true}>
            {sidebar}
          </Nav>
        </div>
      </Dialog>
    </SidebarContext.Provider>
  )
}
