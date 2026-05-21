export default function Home() {
  return (
    <div
      className={
        "bg-bg-void h-screen w-screen font-body text-display flex flex-col justify-center items-center relative"
      }
    >
      <div className="bg-primary/10 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 blur-[100px] absolute top-1/2 left-1/2 animate-breathe z-0" />
      <h1 className="font-display text-display text-primary uppercase tracking-display p-10 text-50 ">
        byteclash
      </h1>
      <h2 className="font-display text-primary text-display uppercase ">
        coming soon
      </h2>
    </div>
  );
}
