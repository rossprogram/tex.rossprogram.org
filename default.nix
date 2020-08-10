{ stdenv, yarn2nix, texlive }:
yarn2nix.mkYarnPackage rec {
    name = "tex-rossprogram-org";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      yarn run lsr2json ${texlive.combined.scheme-full}/share/texmf/ls-R src/lsr.json
      NODE_ENV=production yarn run build
    '';

    meta = with stdenv.lib; {
      description = "A real-time collaborative TeX editor";
      license = licenses.agpl3;
      homepage = "https://github.com/rossprogram/tex.rossprogram.org";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
