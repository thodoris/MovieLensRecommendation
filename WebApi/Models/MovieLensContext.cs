using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace WebApi.Models
{
    public partial class MovieLensContext : DbContext
    {
        public virtual DbSet<Link> Link { get; set; }
        public virtual DbSet<Movie> Movie { get; set; }
        public virtual DbSet<Rating> Rating { get; set; }

        public MovieLensContext(DbContextOptions<MovieLensContext> options) : base(options)
        { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Link>(entity =>
            {
                entity.HasKey(e => e.MovieId)
                    .HasName("PK_links");

                entity.ToTable("link");

                entity.Property(e => e.MovieId)
                    .HasColumnName("movieId")
                    .ValueGeneratedNever();

                entity.Property(e => e.ImdbId)
                    .IsRequired()
                    .HasColumnName("imdbId")
                    .HasColumnType("varchar(10)");

                entity.Property(e => e.TmdbId)
                    .IsRequired()
                    .HasColumnName("tmdbId")
                    .HasColumnType("varchar(10)");

                entity.HasOne(d => d.Movie)
                    .WithOne(p => p.Link)
                    .HasForeignKey<Link>(d => d.MovieId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_links_movies");
            });

            modelBuilder.Entity<Movie>(entity =>
            {
                entity.ToTable("movie");

                entity.Property(e => e.MovieId)
                    .HasColumnName("movieId")
                    .ValueGeneratedNever();

                entity.Property(e => e.Genres)
                    .HasColumnName("genres")
                    .HasMaxLength(200);

                entity.Property(e => e.Title)
                    .HasColumnName("title")
                    .HasMaxLength(200);
            });

            modelBuilder.Entity<Rating>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.MovieId })
                    .HasName("PK_ratings");

                entity.ToTable("rating");

                entity.Property(e => e.UserId).HasColumnName("userId");

                entity.Property(e => e.MovieId).HasColumnName("movieId");

                entity.Property(e => e.Rating1)
                    .IsRequired()
                    .HasColumnName("rating")
                    .HasColumnType("varchar(3)");

                entity.Property(e => e.Timestamp)
                    .HasColumnName("timestamp")
                    .HasColumnType("varchar(50)");

                entity.HasOne(d => d.Movie)
                    .WithMany(p => p.Rating)
                    .HasForeignKey(d => d.MovieId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_ratings_movies");
            });
        }
    }
}