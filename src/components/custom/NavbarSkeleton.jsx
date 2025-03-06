const NavbarSkeleton = () => {
  return (
    <header className="w-full">
      <nav className="flex flex-col sm:flex-row justify-between items-center w-full bg-[#4a82b0] p-4">
        <div className="text-2xl font-bold text-white mb-4 sm:mb-0">Last Man Standing</div>
        <div className="flex space-x-4">
          {/* Match the exact dimensions of your buttons */}
          <div className="w-[86px] h-[36px] bg-white/20 animate-pulse rounded-md"></div>
          <div className="w-[86px] h-[36px] bg-white/20 animate-pulse rounded-md"></div>
        </div>
      </nav>
    </header>
  );
};

export default NavbarSkeleton;
