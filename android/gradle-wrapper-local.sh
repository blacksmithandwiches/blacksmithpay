#!/bin/sh
# Local build helper for THIS VM only (not needed on a normal dev machine,
# where plain ./gradlew works unchanged). It runs Gradle 8.14.3 (same
# version as gradle-wrapper.properties) with three VM workarounds:
#  1. ./gradlew cannot download its distribution here: this sandbox blocks
#     Java's raw egress (proxy CONNECT tunnels for Java fail outright), so
#     Gradle 8.14.3 (bin) is pre-seeded at /home/hatch/workspace/toolchain/gradle-8.14.3 and invoked
#     directly instead of through the wrapper downloader.
#  2. The sandbox kills *IPv4* loopback TCP (127.0.0.1) between processes,
#     which breaks the Gradle client<->daemon socket ("Could not receive a
#     message from the daemon"). IPv6 loopback (::1) is not intercepted, so
#     -Djava.net.preferIPv6Addresses=true is forced on BOTH the client and
#     the daemon via JAVA_TOOL_OPTIONS (inherited by every child JVM).
#  3. HTTP(S) dependency downloads (google()/mavenCentral()) go through the
#     sandbox egress proxy, which MITMs TLS with its own CA. The stock JDK
#     truststore rejects it ("PKIX path building failed"), so a merged
#     truststore (JDK cacerts + the sandbox CA bundle) is built once at
#     ~/workspace/.gradle-tls/cacerts-with-egress and pointed to below.
#     The matching proxy host/port system properties live in this project's
#     gradle.properties (hatch-egress-proxy:3128).
# -Djava.io.tmpdir is also set here because it must reach the *client* JVM,
# and /tmp in this VM is a small (512 MB) tmpfs that fills up mid-build.
TLS_DIR=/home/hatch/workspace/.gradle-tls
if [ ! -f "$TLS_DIR/cacerts-with-egress" ]; then
  mkdir -p "$TLS_DIR"
  cp /home/hatch/workspace/toolchain/jdk21/lib/security/cacerts "$TLS_DIR/cacerts-with-egress"
  awk 'BEGIN{n=0} /-----BEGIN CERTIFICATE-----/{n++} {print > ("'$TLS_DIR'/ca-" n ".pem")}' /run/hatch/egress-tls/ca-bundle.pem
  for f in "$TLS_DIR"/ca-*.pem; do
    grep -q "BEGIN CERTIFICATE" "$f" || continue
    /home/hatch/workspace/toolchain/jdk21/bin/keytool -importcert -noprompt -trustcacerts \
      -alias "egress-$(basename "$f")" -file "$f" \
      -keystore "$TLS_DIR/cacerts-with-egress" -storepass changeit >/dev/null 2>&1
  done
  rm -f "$TLS_DIR"/ca-*.pem
fi
export JAVA_TOOL_OPTIONS="-Djava.net.preferIPv6Addresses=true -Djava.io.tmpdir=/home/hatch/workspace/.tmp -Djavax.net.ssl.trustStore=$TLS_DIR/cacerts-with-egress -Djavax.net.ssl.trustStorePassword=changeit ${JAVA_TOOL_OPTIONS:-}"
exec env JAVA_HOME="${JAVA_HOME:-/home/hatch/workspace/toolchain/jdk21}" /home/hatch/workspace/toolchain/gradle-8.14.3/bin/gradle "$@"
